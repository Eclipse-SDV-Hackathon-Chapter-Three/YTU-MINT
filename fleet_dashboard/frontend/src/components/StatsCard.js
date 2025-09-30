import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

const StatsCard = ({ stat }) => {
  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getIconColor = (color) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            stat.color === 'blue' && 'bg-blue-100',
            stat.color === 'green' && 'bg-green-100',
            stat.color === 'yellow' && 'bg-yellow-100',
            stat.color === 'red' && 'bg-red-100',
            !['blue', 'green', 'yellow', 'red'].includes(stat.color) && 'bg-gray-100'
          )}>
            <stat.icon className={clsx('h-5 w-5', getIconColor(stat.color))} />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">
            {stat.name}
          </p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {stat.value}
            </p>
            {stat.change && (
              <div className={clsx(
                'ml-2 flex items-center text-sm font-medium',
                getChangeColor(stat.changeType)
              )}>
                {getChangeIcon(stat.changeType)}
                <span className="ml-1">{stat.change}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
