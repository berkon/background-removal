const {app, BrowserWindow} = require('electron')
const path = require('path')

// https://google.github.io/mediapipe/getting_started/javascript (Docu)
// https://codepen.io/mediapipe/full/wvJyQpq (Demo)

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true
    }
  })

  mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
