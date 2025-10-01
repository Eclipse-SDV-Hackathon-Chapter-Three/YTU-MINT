use anyhow::Result;
use clap::Parser;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::process::Command;

#[derive(Parser)]
#[command(name = "ankaios-target-provider")]
#[command(about = "Target Provider for Symphony to deploy workloads to Ankaios agents")]
struct Args {
    #[arg(short, long, default_value = "8080")]
    port: u16,
}

#[derive(Debug, Deserialize, Serialize)]
struct Target {
    api_version: String,
    kind: String,
    metadata: TargetMetadata,
    spec: TargetSpec,
}

#[derive(Debug, Deserialize, Serialize)]
struct TargetMetadata {
    name: String,
    namespace: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct TargetSpec {
    target_type: String,
    target_selector: TargetSelector,
    deployment: Deployment,
}

#[derive(Debug, Deserialize, Serialize)]
struct TargetSelector {
    match_labels: HashMap<String, String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct Deployment {
    workload: Workload,
}

#[derive(Debug, Deserialize, Serialize)]
struct Workload {
    name: String,
    image: String,
    version: String,
    env: HashMap<String, String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct DeploymentRequest {
    target: Target,
    action: String, // "deploy", "update", "rollback"
}

#[derive(Debug, Serialize)]
struct DeploymentResponse {
    success: bool,
    message: String,
    deployment_id: String,
    target_agents: Vec<String>,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();
    
    tracing_subscriber::fmt::init();
    
    println!("🚀 Ankaios Target Provider starting on port {}", args.port);
    println!("📡 Ready to receive deployment requests from Symphony");
    
    // Start HTTP server
    start_server(args.port).await?;
    
    Ok(())
}

async fn start_server(port: u16) -> Result<()> {
    use warp::Filter;
    
    let deploy = warp::path("deploy")
        .and(warp::post())
        .and(warp::body::json())
        .and_then(handle_deploy);
    
    let health = warp::path("health")
        .and(warp::get())
        .map(|| "OK");
    
    let routes = deploy.or(health);
    
    println!("🌐 Server running on http://localhost:{}", port);
    warp::serve(routes).run(([0, 0, 0, 0], port)).await;
    
    Ok(())
}

async fn handle_deploy(request: DeploymentRequest) -> Result<impl warp::Reply, warp::Rejection> {
    println!("📦 Received deployment request: {:?}", request);
    
    match deploy_to_ankaios(&request).await {
        Ok(response) => {
            println!("✅ Deployment successful: {}", response.deployment_id);
            Ok(warp::reply::json(&response))
        }
        Err(e) => {
            println!("❌ Deployment failed: {}", e);
            let error_response = DeploymentResponse {
                success: false,
                message: format!("Deployment failed: {}", e),
                deployment_id: "".to_string(),
                target_agents: vec![],
            };
            Ok(warp::reply::json(&error_response))
        }
    }
}

async fn deploy_to_ankaios(request: &DeploymentRequest) -> Result<DeploymentResponse> {
    let target_agents: Vec<String> = request
        .target
        .spec
        .target_selector
        .match_labels
        .get("ankaios.io/agent")
        .unwrap_or(&"".to_string())
        .split(',')
        .map(|s| s.trim().to_string())
        .collect();
    
    println!("🎯 Target agents: {:?}", target_agents);
    
    // Create Ankaios state file for each agent
    for agent_name in &target_agents {
        let state_file = create_ankaios_state(&request, agent_name).await?;
        apply_ankaios_state(&state_file).await?;
        println!("📄 Applied state file for agent: {}", agent_name);
    }
    
    Ok(DeploymentResponse {
        success: true,
        message: format!("Successfully deployed {} to {} agents", 
                        request.target.spec.deployment.workload.name, 
                        target_agents.len()),
        deployment_id: format!("deployment-{}", chrono::Utc::now().timestamp()),
        target_agents,
    })
}

async fn create_ankaios_state(request: &DeploymentRequest, agent_name: &str) -> Result<String> {
    let workload = &request.target.spec.deployment.workload;
    let workload_name = format!("{}-{}", workload.name, agent_name);
    
    let state_content = serde_yaml::to_string(&serde_yaml::Value::Mapping({
        let mut map = serde_yaml::Mapping::new();
        map.insert(
            serde_yaml::Value::String("apiVersion".to_string()),
            serde_yaml::Value::String("v0.1".to_string())
        );
        
        let mut workloads = serde_yaml::Mapping::new();
        let mut workload_config = serde_yaml::Mapping::new();
        
        workload_config.insert(
            serde_yaml::Value::String("runtime".to_string()),
            serde_yaml::Value::String("podman".to_string())
        );
        workload_config.insert(
            serde_yaml::Value::String("agent".to_string()),
            serde_yaml::Value::String(agent_name.to_string())
        );
        workload_config.insert(
            serde_yaml::Value::String("restartPolicy".to_string()),
            serde_yaml::Value::String("ON_FAILURE".to_string())
        );
        
        let runtime_config = format!(
            "image: {}\n  commandOptions: [\"--name\",\"{}\",\"--env\",\"ECU_TYPE={}\",\"--env\",\"ECU_VERSION={}\"]",
            workload.image,
            workload_name,
            workload.name,
            workload.version
        );
        
        workload_config.insert(
            serde_yaml::Value::String("runtimeConfig".to_string()),
            serde_yaml::Value::String(runtime_config)
        );
        
        workloads.insert(
            serde_yaml::Value::String(workload_name),
            serde_yaml::Value::Mapping(workload_config)
        );
        
        map.insert(
            serde_yaml::Value::String("workloads".to_string()),
            serde_yaml::Value::Mapping(workloads)
        );
        
        map
    }))?;
    
    let state_file = format!("/tmp/ankaios-state-{}-{}.yaml", workload.name, agent_name);
    tokio::fs::write(&state_file, state_content).await?;
    
    Ok(state_file)
}

async fn apply_ankaios_state(state_file: &str) -> Result<()> {
    let output = Command::new("ank")
        .arg("apply")
        .arg(state_file)
        .output()
        .await?;
    
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("Failed to apply Ankaios state: {}", error));
    }
    
    println!("✅ Applied Ankaios state file: {}", state_file);
    Ok(())
}
