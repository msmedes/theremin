import { startVideo, load } from 'handtrackjs'

const video = document.getElementById('myvideo')
const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')
const body = document.getElementById('body')

let isVideo = false
let model = null
let oscStarted = false
const glide = 0.5

const minHue = 0
const maxHue = 360
const minLight = 0
const maxLight = 85
const lightFactor = 0.65
const lightFactorOffset = lightFactor * 100
const minFrequency = 60
const maxFrequency = 2000
const minGain = 0
const maxGain = 1

const modelParams = {
  flipHorizontal: true, // flip e.g for video
  maxNumBoxes: 2, // maximum number of boxes to detect
  iouThreshold: 0.5, // ioU threshold for non-max suppression
  scoreThreshold: 0.6, // confidence threshold for predictions.
}

const windowHeight = window.innerHeight
const windowWidth = window.innerWidth

const audioContext = new AudioContext()
const gainNode = audioContext.createGain()
let oscillator = null
const pitchCircle = document.querySelector('#pitchCircle')
const volumeCircle = document.querySelector('#volumeCircle')


gainNode.connect(audioContext.destination)

const startHandtrack = () => {
  startVideo(video).then((status) => {
    if (status) {
      isVideo = true
      runDetection()
    }
  })
}

const calculateFrequency = (x) => {
  const half = windowWidth / 2

  const freq = ((x - half) / half) * (maxFrequency - minFrequency)

  return Math.max(minFrequency, freq)
}

const calculateGain = (y) => 1 - ((y / windowHeight) * maxGain) + minGain

const createOscillator = (coords) => {
  const { volumeY, pitchX } = coords
  oscillator = audioContext.createOscillator()
  oscillator.frequency.linearRampToValueAtTime(calculateFrequency(pitchX), audioContext.currentTime + glide)
  gainNode.gain.linearRampToValueAtTime(calculateGain(volumeY), audioContext.currentTime + glide)
  oscillator.connect(gainNode)
  oscillator.start(audioContext.currentTime)
}

const stopOscillator = () => {
  if (oscillator) {
    oscillator.stop(audioContext.currentTime)
    oscillator.disconnect()
  }
  oscStarted = false
}

const invertHSL = (hue, lightness) => {
  const inverseHue = (hue + 180) % 360
  const color = `hsl(${inverseHue}, 100%, ${lightness}%)`
  return color
}
const drawCircle = (circle, x, y, hue, lightness) => {
  circle.style.display = 'block'
  circle.style.left = `${x}px`
  circle.style.top = `${y}px`
  circle.style.position = 'absolute'
  circle.style.width = '10px'
  circle.style.height = '10px'
  circle.style.borderRadius = '50%'
  circle.style.background = invertHSL(hue, lightness)
}

const getHue = (freq, vol) => {
  const hue = (freq * maxHue) / maxFrequency
  const lightness = (vol * (maxLight * lightFactor)) + lightFactorOffset
  return [hue, lightness]
}
const updateBackground = (hue, lightness) => {
  const color = `hsl(${hue}, 100%, ${lightness}%)`
  body.style.transition = 'background-color .75 ease'
  body.style.backgroundColor = color
}

const getPredictionCoords = (predictions) => {
  let minX = Number.MAX_SAFE_INTEGER
  let minXIndex = 0
  let maxX = Number.MIN_SAFE_INTEGER
  let maxXIndex = 0
  for (let i = 0; i < predictions.length; i += 1) {
    const currX = predictions[i].bbox[0]
    if (currX < minX) {
      minX = currX
      minXIndex = i
    }
    if (currX > maxX) {
      maxX = currX
      maxXIndex = i
    }
  }
  return [predictions[minXIndex], predictions[maxXIndex]]
}

const getVolumeAndPitchCoords = (predictions) => {
  const [predVolume, predPitch] = getPredictionCoords(predictions)
  const volumeX = predVolume.bbox[0] + (predVolume.bbox[2] / 2)
  const volumeY = predVolume.bbox[1] + predVolume.bbox[3]
  const pitchX = predPitch.bbox[0] + (predPitch.bbox[2] / 2)
  const pitchY = predPitch.bbox[1] + predPitch.bbox[3]
  const volumeXScaled = (volumeX * windowWidth) / video.width
  const volumeYScaled = (volumeY * windowHeight) / video.height
  const pitchXScaled = (pitchX * windowWidth) / video.width
  const pitchYScaled = (pitchY * windowHeight) / video.height

  return {
    volumeX: volumeXScaled, volumeY: volumeYScaled, pitchX: pitchXScaled, pitchY: pitchYScaled,
  }
}

const changeFrequency = (coords) => {
  if (oscillator) {
    const freq = calculateFrequency(coords.pitchX)
    const volume = calculateGain(coords.volumeY)
    oscillator.frequency.linearRampToValueAtTime(freq, audioContext.currentTime + glide)
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + glide)
    const [hue, lightness] = getHue(freq, volume)
    updateBackground(hue, lightness)
    drawCircle(volumeCircle, coords.volumeX, coords.volumeY, hue, lightness)
    drawCircle(pitchCircle, coords.pitchX, coords.pitchY, hue, lightness)
  }
}


const runDetection = () => {
  model.detect(video).then((predictions) => {
    // model.renderPredictions(predictions, canvas, context, video)
    if (predictions.length > 0) {
      const coords = getVolumeAndPitchCoords(predictions)
      if (!oscStarted) {
        createOscillator(coords)
        oscStarted = true
      } else {
        changeFrequency(coords)
      }
    }
    if (isVideo) {
      requestAnimationFrame(runDetection)
    }
  })
}

load(modelParams).then((lmodel) => {
  model = lmodel
  runDetection()
})

startHandtrack()
