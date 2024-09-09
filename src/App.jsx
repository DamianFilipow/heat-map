import { useState, useEffect } from 'react'
import * as d3 from "d3"

function App() {
  const [varianceData, setVarianceData] = useState([])
  const [baseTemperatureData, setBaseTemperatureData] = useState(0)
  const [displayDate, setDisplayDate] = useState('')
  const [displayTemperature, setDisplayTemperature] = useState(0)
  const [displayVariance, setDisplayVarianceData] = useState(0)
  const [tooltipStyle, setTooltipStyle] = useState({
    "visibility": 'hidden',
    "position": "absolute",
    "left": 0,
    "top": 0
  })
  const [tooltipDataYear, setTooltipDataYear] = useState(0)

  const dataUrl = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'

  useEffect(() => {

    fetch(dataUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Newwork response was not ok!')
          }
          return response.json()
        })
        .then(fetchData => {
          setVarianceData(fetchData.monthlyVariance)
          setBaseTemperatureData(fetchData.baseTemperature)
        })
        .catch(error => {
          console.error("Error: ", error)
        })
  }, [])


    useEffect(() => {

      if (varianceData.length === 0) return;

      d3.selectAll('svg > *').remove()
      d3.selectAll('svg').remove()
      
      const formatMonth = d3.timeFormat('%B')
      const w = 1400
      const h = 650
      const margin = 100
      const tempRange = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]


      const yScale = d3.scaleBand()
                        .domain(d3.range(12))
                        .range([h - margin, margin])


      const xScale = d3.scaleTime()
                        .domain([
                                d3.min(varianceData, d => new Date(d.year + 1, 0, 1)),
                                d3.max(varianceData, d => new Date(d.year + 2, 0, 1))
                                ])
                        .range([margin, w - margin])

      const colorMap = d3.scaleDiverging()
                          .domain([d3.min(varianceData, d => (d.variance + baseTemperatureData)),
                                  (d3.min(varianceData, d => (d.variance + baseTemperatureData)) +
                                  d3.max(varianceData, d => (d.variance + baseTemperatureData))) / 2,
                                  d3.max(varianceData, d => (d.variance + baseTemperatureData))])
                          .range(['blue', 'white', 'red'])

      const colorScale = d3.scaleLinear()
                          .domain([d3.min(varianceData, d => d.variance + baseTemperatureData),
                                    d3.max(varianceData, d => d.variance + baseTemperatureData)
                          ])
                          .range([0, 640])

      const svg = d3.select('main')
                    .append('svg')
                    .attr('width', w)
                    .attr('height', h)

      const yAxis = d3.select('svg')
                      .append('g')
                      .attr('id', 'y-axis')
                      .attr('transform', `translate(${margin}, 0)`)
                      .call(d3.axisLeft(yScale).tickFormat(i => formatMonth(new Date(0, i))))
      

      const xAxis = svg.append('g')
                      .attr('id', 'x-axis')
                      .attr('transform', `translate(0, ${h - margin})`)
                      .call(d3.axisBottom(xScale).ticks(20, '%Y'))

      const colorAxis = svg.append('g')
                            .attr('id', 'legend')
                            .attr('transform', `translate(${margin}, 630)`)
                            .call(d3.axisBottom(colorScale))
      
      colorAxis.selectAll('rect')
        .data(tempRange)
        .enter()
        .append('rect')
        .attr('fill', d => colorMap(d))
        .attr('width', 640 / tempRange.length)
        .attr('height', 30)
        .attr('x', d => colorScale(d))
        .attr('y', -30)
  
                          

      svg.selectAll('rect')
          .data(varianceData)
          .enter()
          .append('rect')
          .attr('class', 'cell')
          .attr('fill', d => colorMap(d.variance + baseTemperatureData))
          .attr('data-month', d => d.month - 1)
          .attr('data-year', d => d.year)
          .attr('data-temp', d => (d.variance + baseTemperatureData).toFixed(1))
          .attr('width',  w / (d3.max(varianceData, d => d.year) - d3.min(varianceData, d => d.year)))
          .attr('height', (h - margin * 2) / 12)
          .attr('x', d => xScale(new Date ().setFullYear(d.year)))
          .attr('y', d => yScale(d.month - 1))
          .on('mouseover', (event) => {
            event.target.style.opacity = '10%'
            setTooltipStyle(p => ({
              ...p,
              "visibility": 'visible',
              "left": `${event.pageX - 50}px`,
              'top': `${event.pageY - 115}px` 
            }))
            setDisplayDate(`${event.target.getAttribute('data-year')} - ${formatMonth(new Date(1970, event.target.getAttribute('data-month')))}`)
            setDisplayTemperature(event.target.getAttribute('data-temp'))
            setTooltipDataYear(event.target.getAttribute('data-year'))
            setDisplayVarianceData((event.target.getAttribute('data-temp') - baseTemperatureData).toFixed(1))
          })
          .on('mouseout', (event) => {
            event.target.style.opacity = '100%'
            setTooltipStyle(p => ({
              ...p,
              "visibility": 'hidden'
            }))
          })
          

          return () => {
            d3.selectAll('rect').on("mouseover", null).on('mouseout', null)
          }

    }, [varianceData])

  return (
    <main>
      <h1 id='title'>Monthly Global Land-Surface Temperature
      </h1>
      <h2 id='description'>1753 - 2015: base temperature 8.66℃</h2>
      <div id='tooltip' style={tooltipStyle} data-year={tooltipDataYear}>
        {displayDate}<br />
        {displayTemperature} ℃<br />
        {displayVariance > 0 ? `+${displayVariance}` : displayVariance} ℃
      </div>
    </main>
  )
}

export default App
