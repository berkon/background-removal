const controls = window;
const mpSelfieSegmentation = window;
const videoElement = document.getElementsByClassName('input_video')[0]
const canvasElement = document.getElementsByClassName('output_canvas')[0]
const controlsElement = document.getElementsByClassName('control-panel')[0]
const canvasCtx = canvasElement.getContext('2d')

const fpsControl = new controls.FPS()

const spinner = document.querySelector('.loading')
spinner.ontransitionend = () => { spinner.style.display = 'none' }

let activeEffect = 'mask'

const backgroundImage = new Image()
backgroundImage.src = 'beach.png'

backgroundImage.onload = async () => {
    let backgroundFill = canvasCtx.createPattern ( backgroundImage, 'no-repeat' )

    function onResults(results) {
        document.body.classList.add('loaded')
        fpsControl.tick()
        canvasCtx.save()
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        canvasCtx.drawImage( results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height)

        if (activeEffect === 'mask' || activeEffect === 'both') {
            canvasCtx.globalCompositeOperation = 'source-in'
            // This can be a color or a texture or whatever...
            canvasCtx.fillStyle = '#00FF007F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        } else {
            canvasCtx.globalCompositeOperation = 'source-out';
            //canvasCtx.fillStyle = '#0000FF7F';
            canvasCtx.fillStyle = backgroundFill
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }

        // Only overwrite missing pixels.
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage ( results.image, 0, 0, canvasElement.width, canvasElement.height )
        canvasCtx.restore()
    }

    const selfieSegmentation = new SelfieSegmentation ({
        locateFile: file => { 
            return `./node_modules/@mediapipe/selfie_segmentation/${file}`
//          return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`
        }
    })

    // This initialize() call is not present in the web-demo. But according to this post it looks like it is necessary:
    // https://github.com/google/mediapipe/issues/2823. Looks like it fixes the issue with the freezing video at statup.
    await selfieSegmentation.initialize()
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