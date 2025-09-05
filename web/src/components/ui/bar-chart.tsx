import * as React from 'react'
import { cn } from '../../lib/utils'
import { getChartColor } from '../../lib/tokens'

export interface BarChartData {
  label: string
  value: number
  category?: string
}

export interface BarChartProps {
  data: BarChartData[]
  height?: number
  className?: string
  showValues?: boolean
  maxBars?: number
}

export function BarChart({ 
  data, 
  height = 220, 
  className,
  showValues = true,
  maxBars = 7
}: BarChartProps) {
  // Limit and prepare data
  const chartData = data.slice(0, maxBars)
  const maxValue = Math.max(...chartData.map(d => d.value))
  const barWidth = Math.max(24, Math.min(48, (100 - (chartData.length - 1) * 2.5) / chartData.length))
  
  return (
    <div className={cn('w-full font-primary', className)}>
      <div className="relative" style={{ height: height }}>
        <svg 
          width="100%" 
          height={height} 
          className="overflow-visible"
          role="img" 
          aria-label="Bar chart"
        >
          {/* Chart bars */}
          {chartData.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 60) : 0
            const x = (index * (100 / chartData.length)) + '%'
            const color = getChartColor(index)
            
            return (
              <g key={`${item.label}-${index}`}>
                {/* Bar */}
                <rect
                  x={x}
                  y={height - 40 - barHeight}
                  width={`${barWidth}%`}
                  height={barHeight}
                  fill={color}
                  rx="12"
                  ry="12"
                  className="transition-all duration-slow"
                  style={{
                    transformOrigin: 'bottom center',
                    animation: `growUp var(--duration-slow) var(--ease-decelerate) ${index * 50}ms both`
                  }}
                />
                
                {/* Value label */}
                {showValues && item.value > 0 && (
                  <g>
                    {/* Value bubble background */}
                    <rect
                      x={`calc(${x} + ${barWidth/2}% - 16px)`}
                      y={height - 55 - barHeight}
                      width="32"
                      height="20"
                      fill="var(--color-text-primary)"
                      rx="10"
                      ry="10"
                      className="opacity-90"
                    />
                    {/* Value text */}
                    <text
                      x={`calc(${x} + ${barWidth/2}%)`}
                      y={height - 42 - barHeight}
                      textAnchor="middle"
                      fill="var(--color-card)"
                      className="text-label font-primary font-bold"
                      fontSize="11"
                    >
                      {item.value}
                    </text>
                  </g>
                )}
                
                {/* X-axis label */}
                <text
                  x={`calc(${x} + ${barWidth/2}%)`}
                  y={height - 10}
                  textAnchor="middle"
                  fill="var(--color-text-secondary)"
                  className="text-caption font-primary font-medium"
                  fontSize="11"
                >
                  {item.label}
                </text>
              </g>
            )
          })}
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = height - 40 - (percent / 100) * (height - 60)
            return (
              <line
                key={percent}
                x1="0"
                x2="100%"
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth="1"
                opacity="0.3"
              />
            )
          })}
        </svg>
      </div>
      
      <style jsx>{`
        @keyframes growUp {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  )
}