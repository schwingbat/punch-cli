const chartsBox = document.getElementById('charts')
const canvas = document.createElement('canvas')
chartsBox.appendChild(canvas)

const days = window.templateData
const byTask = {}

const parseHours = (timeStr) => {
  const parts = timeStr.split(/[hm]/).map(p => p.trim()).filter(p => p != '')
  let minutes = parts.pop() || 0
  let hours = parts.pop() || 0
  return Number(hours) + (Number(minutes) / 60)
}

days.forEach(day => {
  day.comments.forEach(comment => {
    console.log(comment)
    if (comment.objects.length === 0) {
      byTask['Other'] = (byTask['Other'] || 0) + parseHours(day.time)
    } else {
      comment.objects.forEach(object => {
        if (object.key === 'vsts') {
          console.log(day.time, parseHours(day.time))
          byTask[object.value] = (byTask[object.value] || 0) + parseHours(day.time)
        }
      })
    }
  })
})

chartsBox.appendChild(document.createTextNode(JSON.stringify(byTask, null, 2)))

const chart = new Chart(canvas.getContext('2d'), {
  type: 'doughnut',
  data: {
    datasets: [{
      data: Object.values(byTask)
    }],
    labels: Object.keys(byTask).map(k => {
      if (k === 'Other') {
        return 'Other (' + byTask[k].toFixed(1) + ' hours)'
      } else {
        return '#' + k + ' (' + byTask[k].toFixed(1) + ' hours)'
      }
    })
  }
}, {

})