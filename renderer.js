const controls = window;
const mpSelfieSegmentation = window;
const videoElement = document.getElementsByClassName('input_video')[0]
const canvasElement = document.getElementsByClassName('output_canvas')[0]
const bkgCanvasElement = document.createElement('canvas');
bkgCanvasElement.width = 1280
bkgCanvasElement.height = 720
const controlsElement = document.getElementsByClassName('control-panel')[0]
const canvasCtx = canvasElement.getContext('2d')
const bkgCanvasCtx = bkgCanvasElement.getContext('2d')
const fpsControl = new controls.FPS()

const spinner = document.querySelector('.loading')
spinner.ontransitionend = () => { spinner.style.display = 'none' }

const backgroundImage = new Image()
backgroundImage.src = 'beach.png'

backgroundImage.onload = async () => {
    function onResults(results) {
        document.body.classList.add('loaded')
        fpsControl.tick()
        canvasCtx.save()

        // Clear both canvases
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        bkgCanvasCtx.clearRect(0, 0, bkgCanvasElement.width, bkgCanvasElement.height)

        // Draw original video frame onto to a hidden canvas and blur it
        bkgCanvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height)
        bkgCanvasCtx.filter = 'blur(10px)';

        // Draw the red shape of the cut out person onto the output canvas
        canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height)

        // Draw the content from the hidden (blurred) canvas onto the output canvas. But only where there is NO red person-shape
        canvasCtx.globalCompositeOperation = 'source-out';
        canvasCtx.drawImage(bkgCanvasElement, 0, 0);

        // Draw the original video rame onto the output canvas. But only where there is the red person-shape
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height)

        canvasCtx.restore()
    }

    const selfieSegmentation = new SelfieSegmentation ({
        locateFile: file => { return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}` }
    })

    await selfieSegmentation.initialize() // https://github.com/google/mediapipe/issues/2823
    selfieSegmentation.onResults(onResults)

    // modelSelection: 1 (landscape model => faster), 0 (general model => slower)
    new controls
        .ControlPanel ( controlsElement, {
            selfieMode: true,
            modelSelection: 1,
            effect: 'background',
        })
        .add ([
            fpsControl,
            new controls.Toggle ({ title: 'Selfie Mode', field: 'selfieMode' }),
            new controls.SourcePicker ({
                onSourceChanged: () => { selfieSegmentation.reset() },
                onFrame: async (input, size) => {
                    const aspect = size.height / size.width
                    let width, height

                    if (window.innerWidth > window.innerHeight) {
                        height = window.innerHeight
                        width = height / aspect
                    } else {
                        width = window.innerWidth
                        height = width * aspect
                    }

                    canvasElement.width = width
                    canvasElement.height = height
                    await selfieSegmentation.send({image: input})
                },
            }),
            new controls.Slider({
                title: 'Quality',
                field: 'modelSelection',
                discrete: ['High (slower)', 'Low (faster)']
            })
        ])
        .on ( x => {
            const options = x
            videoElement.classList.toggle('selfie', options.selfieMode)
            activeEffect = x['effect']
            selfieSegmentation.setOptions(options)
        })
}