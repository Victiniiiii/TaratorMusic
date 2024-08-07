// index.js

// TODO: remove unnecessary functions
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const taratorFolder = __dirname;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 850,
        title: "TaratorMusic",
        icon: path.join(taratorFolder, 'thumbnails/tarator16_icon.png'),
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            additionalArguments: ['Content-Security-Policy', "script-src 'self' 'nonce-6vrfjvkCAwBXQF+vNhKVlA==';"] // try to remove nonce ( or this line completely )
        }
    });

    mainWindow.loadFile('index.html');    
}

app.whenReady().then(() => {
    // Menu.setApplicationMenu(null); ( removes the bar at the top )
    app.setName("TaratorMusic");
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

function readPlaylists(callback) { // merge this one and the bottom function ? 
    const playlistsFilePath = path.join(taratorFolder, 'playlists.json');

    fs.readFile(playlistsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading playlists file:', err);
            callback([]);
            return;
        }

        try {
            const playlists = JSON.parse(data);
            callback(playlists);
        } catch (parseErr) {
            console.error('Error parsing playlists file:', parseErr);
            callback([]);
        }
    });
}

ipcMain.on('get-playlists', (event) => {
    readPlaylists((playlists) => {
        event.reply('send-playlists', playlists);
    });
});

ipcMain.handle('get-music-path', (event) => { // Remove this part ?
    const musicFolderPath = path.join(taratorFolder, 'musics');
    return musicFolderPath;
});

ipcMain.on('get-music-files', async (event) => {
try {
    const desktopPath = app.getPath('desktop');
    const musicFolderPath = path.join(taratorFolder, 'musics');
    const files = await fs.promises.readdir(musicFolderPath);
    const musicFiles = files
        .filter(file => file.toLowerCase() !== 'desktop.ini') 
        .map(file => ({
            name: file,
            thumbnail: `file://${path.join(taratorFolder,"thumbnail", file,"_thumbnail")}`
        }));
    event.reply('music-files', musicFiles);
    } catch (error) {
    console.error('Error reading Music directory:', error);
    event.reply('music-files', []);
    }
});

ipcMain.on('create-playlist', (event, playlistData) => {
    const { playlistName, thumbnailFilePath } = playlistData;    
    const thumbnailsDirectory = path.join(taratorFolder, 'thumbnails');
    const playlistsFilePath = path.join(taratorFolder, 'playlists.json');

    fs.readFile(playlistsFilePath, 'utf8', (err, data) => {
        let playlists = [];

        if (!err && data) {
            try {
                playlists = JSON.parse(data);
                if (playlists.find(playlist => playlist.name === playlistName)) {
                    event.reply('playlist-creation-error', 'Playlist name already exists.'); 
                    return; 
                }
            } catch (parseErr) { 
                console.error('Error parsing playlists file:', parseErr); 
            }
        }

        const newPlaylist = {
            name: playlistName,
            songs: [],
            thumbnail: path.join(thumbnailsDirectory, `${playlistName}_playlist.jpg`)
        };

        playlists.push(newPlaylist);

        fs.writeFile(playlistsFilePath, JSON.stringify(playlists, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error updating playlists file:', writeErr);
                return;
            }
            if (thumbnailFilePath) {
                const newThumbnailPath = path.join(thumbnailsDirectory, `${playlistName}_playlist.jpg`);
                fs.copyFile(thumbnailFilePath, newThumbnailPath, (copyErr) => {
                    if (copyErr) {
                        console.error('Error copying thumbnail file:', copyErr);
                        return;
                    }
                    event.reply('playlist-created', newPlaylist);
                });
            } else {
                event.reply('playlist-created', newPlaylist);
            }
        });
    });
});