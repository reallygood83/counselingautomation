'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export interface SELData {
  selfAwareness: number      // 자기인식
  selfManagement: number     // 자기관리
  socialAwareness: number    // 사회적 인식
  relationship: number       // 관계기술
  decisionMaking: number     // 책임감있는 의사결정
}

interface SELChartProps {
  data: SELData
  studentName: string
  size?: 'sm' | 'md' | 'lg'
  showLegend?: boolean
}

export function SELChart({ 
  data, 
  studentName, 
  size = 'md', 
  showLegend = true 
}: SELChartProps) {
  const chartData = [
    {
      area: '자기인식',
      score: data.selfAwareness,
      fullMark: 5,
    },
    {
      area: '자기관리',
      score: data.selfManagement,
      fullMark: 5,
    },
    {
      area: '사회인식',
      score: data.socialAwareness,
      fullMark: 5,
    },
    {
      area: '관계기술',
      score: data.relationship,
      fullMark: 5,
    },
    {
      area: '의사결정',
      score: data.decisionMaking,
      fullMark: 5,
    },
  ]

  const sizeConfig = {
    sm: { height: 200, fontSize: 11 },
    md: { height: 300, fontSize: 12 },
    lg: { height: 400, fontSize: 13 }
  }

  const currentSize = sizeConfig[size]
  const average = Object.values(data).reduce((a, b) => a + b, 0) / 5

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-lg text-gray-900">
          {studentName} SEL 분석
        </h3>
        <div className="flex justify-center items-center gap-4 mt-2">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              average >= 4 ? 'text-green-600' :
              average >= 3 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {average.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600">전체 평균</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={currentSize.height}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis 
            dataKey="area" 
            tick={{ fontSize: currentSize.fontSize, fontFamily: 'Pretendard' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fontSize: currentSize.fontSize - 1, fill: '#666' }}
            tickCount={6}
          />
          
          <Radar
            name={studentName}
            dataKey="score"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="sel-chart-tooltip">
                    <p className="font-medium">{data.area}</p>
                    <p className="text-blue-600">
                      점수: <span className="font-bold">{data.score}/5</span>
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          
          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: currentSize.fontSize,
                fontFamily: 'Pretendard'
              }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        {chartData.map((item) => (
          <div key={item.area} className="text-center">
            <div className={`text-lg font-bold ${
              item.score >= 4 ? 'text-green-600' :
              item.score >= 3 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {item.score}
            </div>
            <p className="text-xs text-gray-600 leading-tight">
              {item.area}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}