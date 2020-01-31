# CV Theremin

It's a theremin you can control with your hands! So that's fun.

to run:
`npm run dev`

I would recommend pointing your camera down towards your hands, unless you want to control the theremin with your face. I currently have the video feed off, though you can turn if back on by uncommenting line 166 in `index.js`: `// model.renderPredictions(predictions, canvas, context, video)` if you want to get an idea for positioning.

To control the volume, move your left hand up and down. To control pitch move your right hand side to side. The lower bound for the frequency is currently 20, and the x threshold is the midline of the window width. (aka your right hand needs to the right of the middle of the screen)

It's going to seem...chunky. That's because the cv model seems to operate at about 5-10 fps max, so we can only update the theremin oscillator frequency at that frame rate, and the same goes for the background colors.
