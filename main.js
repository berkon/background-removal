const {app, BrowserWindow} = require('electron')
const path = require('path')

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
