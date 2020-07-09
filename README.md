# [CV Theremin](https://theremin.now.sh)

CV Theremin is a low-medium performance musical instrument you can "control" by waving your hands about. Made possible by the [WebAudio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) and
[Handtrack.js](https://github.com/victordibia/handtrack.js/).

Disclaimer: I wrote this in about 3 hours don't @ me

## Running locally

To install:
`npm install`

To run:
`npm run dev`

Go to `localhost:1234`

Make music! (kind of)

## Some important stuff to know

I would recommend pointing your camera down towards your hands, unless you want to control the theremin with your face (you can do this). I currently have the video feed off, though you can turn if back on by uncommenting line 158 in `index.js`:

```js
const runDetection = () => {
  model.detect(video).then(predictions => {
    // model.renderPredictions(predictions, canvas, context, video) <--- uncomment me!
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
```

To control the volume, move your left hand up and down. To control pitch move your right hand side to side. The frequency range is currently 20-2000hz, and the x threshold is the midline of the window width. (aka your right hand needs to the right of the middle of the screen)

It's going to seem...chunky. That's because the cv model seems to operate at about 5-10 fps max, so we can only update the theremin oscillator frequency at that frame rate, along with the background colors.

## Hand Positioning

The CV model was trained on a dataset that consisted mostly of pictures taken from a top -> down perspective aka eye level -> seated, so to increase performance/accuracy think T-Rex hands, or channel Uma Thurman in Pulp Fiction ![Uma Thurman T-Rex Hands](https://media.giphy.com/media/l2YWwvuPQYndJTxGo/giphy.gif)

Making a fist works ok as well.  Real theremins, as well as this program, have a high sensitivity to small changes in hand positioning.  You can easily go through one octave of a scale by starting with a fist and extending your pinky finger outwards without changing the position on the x-axis, as the hand positiong is computed by taking the mid-point of the bounding box.
