// renderer.js

const { ipcRenderer } = require('electron');
const icon = require('./svg.ts');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const taratorFolder = path.join(require('os').homedir(), 'Desktop', 'music', 'TaratorMusic'); // TODO

let currentPlayingElement = null;
let audioElement = null;
let secondfilename = null;
let currentPlaylist = null;
let currentPlaylistElement = null;
let isShuffleActive = false;
let isAutoplayActive = false;
let isLooping = false;
let newThumbnailPath;
let domates = null;
let playedSongs = [];
let playlistPlayedSongs = [];
let havuc = null;
let isSaveAsPlaylistActive = false;

let maximumPreviousSongCount;
if ( JSON.parse(localStorage.getItem('maximumPreviousSongCount')) == null) {
    maximumPreviousSongCount = 50;
} else {
    maximumPreviousSongCount = JSON.parse(localStorage.getItem('maximumPreviousSongCount'))
}
document.getElementById('arrayLength').value = maximumPreviousSongCount;

function changeThePreviousSongAmount() {
    console.log("working")
    if (document.getElementById('arrayLength').value > 9 && document.getElementById('arrayLength').value < 101 ) { 
        maximumPreviousSongCount = document.getElementById('arrayLength').value; 
        localStorage.setItem("maximumPreviousSongCount", document.getElementById('arrayLength').value );  
    } else {
        alert('Please set a number between 10 and 100')
    }
    document.getElementById('arrayLength').value = maximumPreviousSongCount;
}

let pytubeApiTest = JSON.parse(localStorage.getItem('pytubeApiTest'));
let discordApi = JSON.parse(localStorage.getItem('discordApi'));

if (pytubeApiTest === null) { 
    pytubeApiTest = true;
    localStorage.setItem('pytubeApiTest', JSON.stringify(pytubeApiTest));
}

if (discordApi === null) { 
    discordApi = true;
    localStorage.setItem('discordApi', JSON.stringify(discordApi));
}

function togglePytubeTest() {
    pytubeApiTest = !pytubeApiTest;
    localStorage.setItem("pytubeApiTest", JSON.stringify(pytubeApiTest));
    pytubeTesting();
}

function toggleDiscordAPI() {
    discordApi = !discordApi;
    localStorage.setItem("discordApi", JSON.stringify(discordApi));
    updateDiscordPresence();
}

document.getElementById("toggleSwitchPytube").checked = pytubeApiTest;
document.getElementById("toggleSwitchDiscord").checked = discordApi;

function pytubeTesting() {
    if (pytubeApiTest == true) {
        const pythonProcess = spawn('python', ['test.py']);
        let scriptOutput = '';

        pythonProcess.stdout.on('data', (data) => { scriptOutput += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { scriptOutput += data.toString(); });
        pythonProcess.on('close', () => {
            if (!scriptOutput.toLowerCase().includes("error")) {
                document.getElementById('mainmenupytubeapi').innerHTML = "Pytube API Status: Online"
                document.getElementById('mainmenupytubeapi').style.color = 'green';
            } else {
                document.getElementById('mainmenupytubeapi').innerHTML = "Pytube API Status: Down"
                document.getElementById('mainmenupytubeapi').style.color = 'red';
            }
        });
    } else {
        document.getElementById('mainmenupytubeapi').innerHTML = "Pytube API Testing: Disabled"
        document.getElementById('mainmenupytubeapi').style.color = 'yellow';
    }
}

pytubeTesting();

const clientId = '1258898699816275969'; // not a private key, just the ID of my app
const DiscordRPC = require('discord-rpc');
const RPC = new DiscordRPC.Client({ transport: 'ipc' });
DiscordRPC.register(clientId);

if (discordApi == true) {
    RPC.on('ready',async () => {updateDiscordPresence();})
    RPC.login({ clientId }).catch(err => console.error(err));
}

async function updateDiscordPresence() {
    if (discordApi == true) {
        if (!RPC) {
            document.getElementById('mainmenudiscordapi').innerHTML = "Discord API Status: Down"
            document.getElementById('mainmenudiscordapi').style.color = 'red';
            return;        
        }
        const deneme = document.getElementById('song-name').textContent;  
        document.getElementById('mainmenudiscordapi').innerHTML = "Discord API Status: Online"
        document.getElementById('mainmenudiscordapi').style.color = 'green';  
        if (deneme == "No song is being played.") {
            RPC.setActivity ({
                details: "Launching the app",
                largeImageKey: "tarator1024_icon",
                largeImageText: "TaratorMusic",
            });
        } else {
            const time = document.getElementById('video-length').textContent;
            RPC.setActivity ({
                details: deneme,
                state: time,            
                largeImageKey: "tarator1024_icon",
                largeImageText: "TaratorMusic",
            });
        }
    } else {
        document.getElementById('mainmenudiscordapi').innerHTML = "Discord API Status: Disabled"
        document.getElementById('mainmenudiscordapi').style.color = 'yellow';
    }
}

updateDiscordPresence();

const tabs = document.querySelectorAll('.sidebar div');
const tabContents = document.querySelectorAll('.tab-content');
const volumeControl = document.getElementById('volume');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const videothumbnailbox = document.getElementById('videothumbnailbox');
const createPlaylistModal = document.getElementById('createPlaylistModal');
const customizeModal = document.getElementById('customizeModal');
const downloadModal = document.getElementById('downloadModal');
const speedModal = document.getElementById('speedModal');
const speedOptions = document.getElementById('speedOptions');
const muteButton = document.getElementById('muteButton');
const loopButton = document.getElementById('loopButton');
const editPlaylistModal = document.getElementById('editPlaylistModal');

document.getElementById('backwardButton').innerHTML = icon.backward;
document.getElementById('previousSongButton').innerHTML = icon.previous;
document.getElementById('playButton').innerHTML = icon.play;
document.getElementById('pauseButton').innerHTML = icon.pause;
document.getElementById('nextSongButton').innerHTML = icon.next;
document.getElementById('forwardButton').innerHTML = icon.forward;
document.getElementById('autoplayButton').innerHTML = icon.redAutoplay;
document.getElementById('shuffleButton').innerHTML = icon.redShuffle;
document.getElementById('muteButton').innerHTML = icon.mute;
document.getElementById('speedButton').innerHTML = icon.speed;
document.getElementById('loopButton').innerHTML = icon.redLoop;

let previousVolume = volumeControl.value;
volumeControl.value = localStorage.getItem('volume') || 100;
if (audioElement) { audioElement.volume = volumeControl.value / 100; }

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(div => div.classList.remove('active'));
        tab.classList.add('active');

        const tabContentId = `${tab.id}-content`;
        tabContents.forEach(content => {
            content.classList.add('hidden');
            if (content.id === tabContentId) {
                content.classList.remove('hidden');
                document.getElementById('main-menu-content').style.display = 'none';
                document.getElementById('my-music-content').style.display = 'none';                    
                document.getElementById('playlists-content').style.display = 'none';
                document.getElementById('settings-content').style.display = 'none'; // TODO: Switchlendiğinde scroll bar en tepeye gelsin
                if (content.id === "main-menu-content") {
                    document.getElementById('main-menu-content').style.display = 'flex';
                } else if (content.id === "my-music-content") {
                    document.getElementById('my-music-content').style.display = 'grid';
                } else if (content.id === "playlists-content"){
                    document.getElementById('playlists-content').style.display = 'grid';
                } else if (content.id === "settings-content"){
                    document.getElementById('settings-content').style.display = 'flex';
                }
            }
        });
    });
});

document.getElementById('my-music').addEventListener('click', () => {
    const myMusicContent = document.getElementById('my-music-content');
    myMusicContent.innerHTML = '';

    const musicsearch = document.createElement('input');
    musicsearch.setAttribute('type', 'text');
    musicsearch.setAttribute('id', 'music-search');
    musicsearch.setAttribute('placeholder', 'Search...');

    musicsearch.addEventListener('input', () => {
        const searchQuery = musicsearch.value.trim().toLowerCase();
        const musicItems = myMusicContent.querySelectorAll('.music-item');

        musicItems.forEach(item => {
            const songName = item.getAttribute('data-file-name').toLowerCase();
            if (songName.includes(searchQuery)) {
                item.style.display = 'block';  
            } else {
                item.style.display = 'none'; 
            }
        });
    });

    myMusicContent.appendChild(musicsearch);

    ipcRenderer.send('get-music-files');
    ipcRenderer.once('music-files', (event, musicFiles) => {
        musicFiles.forEach(file => {
            const musicElement = createMusicElement(file);
            myMusicContent.appendChild(musicElement);

            if (currentPlayingElement && file.name === currentPlayingElement.getAttribute('data-file-name')) {
                musicElement.classList.add('playing');
            }
    
            const backgroundElement = musicElement.querySelector('.background-element');
            if (backgroundElement) {
                backgroundElement.addEventListener('click', () => {
                    playMusic(file, musicElement);
                });
            }
        });
    });    
});

function createMusicElement(file) {
    const musicElement = document.createElement('div');
    musicElement.classList.add('music-item');
    musicElement.setAttribute('alt', file.name);
    musicElement.setAttribute('data-file-name', file.name);

    const fileNameWithoutExtension = path.parse(file.name).name;
    const encodedFileName = encodeURIComponent(fileNameWithoutExtension);
    const decodedFileName = decodeURIComponent(encodedFileName);
    const thumbnailFolder = path.join(taratorFolder, 'thumbnails');
    const thumbnailFileName = `${decodedFileName}_thumbnail.jpg`;
    const thumbnailPath = path.join(thumbnailFolder, thumbnailFileName.replace(/%20/g, ' '));
    if (newThumbnailPath) {thumbnailPath = newThumbnailPath};

    let thumbnailUrl = `file://${path.join(thumbnailFolder, '_placeholder.jpg').replace(/\\/g, '/')}`;

    if (fs.existsSync(thumbnailPath)) {
        thumbnailUrl = `file://${thumbnailPath.replace(/\\/g, '/')}`;
    } else {
        console.log("Tried to get thumbnail from", thumbnailPath, "but failed. Used", thumbnailUrl, "instead.");
    }

    const backgroundElement = document.createElement('div');
    backgroundElement.classList.add('background-element'); 
    backgroundElement.style.backgroundImage = `url('${thumbnailUrl}')`;
    musicElement.appendChild(backgroundElement);

    const songNameElement = document.createElement('div');
    songNameElement.classList.add('song-name');
    songNameElement.innerText = fileNameWithoutExtension; 

    const songLengthElement = document.createElement('div');
    songLengthElement.classList.add('song-length');

    const customizeButton = document.createElement('button');
    customizeButton.innerHTML = icon.customise;
    customizeButton.classList.add('customize-button');
    customizeButton.addEventListener('click', () => { openCustomizeModal(file.name, thumbnailUrl); });

    const addToPlaylistButton = document.createElement('button');
    addToPlaylistButton.innerHTML = icon.addToPlaylist;
    addToPlaylistButton.classList.add('add-to-playlist-button');
    addToPlaylistButton.addEventListener('click', () => { openAddToPlaylistModal(file.name); });

    musicElement.appendChild(songLengthElement);
    musicElement.appendChild(songNameElement);
    musicElement.appendChild(customizeButton);
    musicElement.appendChild(addToPlaylistButton);

    const audio = new Audio();
    const filePath = path.join(taratorFolder, 'musics', file.name);
    audio.src = `file://${filePath}`;
    audio.addEventListener('loadedmetadata', () => { songLengthElement.innerText = formatTime(audio.duration); });
    return musicElement;
}

async function playMusic(file, clickedElement, isPlaylist = false) {
    const songName = document.getElementById('song-name');    

    if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
    }

    try {
        if (!isPlaylist) {currentPlaylist = null;}
        const musicPath = path.join(taratorFolder, 'musics'); // BURAYI DEĞİŞTİRDİM
        audioElement = new Audio();
        manageAudioControls(audioElement); 
        audioElement.addEventListener('loadedmetadata', () => {
            songDuration = audioElement.duration;
        });
        audioElement.controls = true;
        audioElement.autoplay = true;
        secondfilename = file.name;

        if (file.name.endsWith('.mp3')) {
            songName.textContent = file.name.slice(0, -4);
        } else { 
            songName.textContent = file.name
            secondfilename = secondfilename + ".mp3"; 
        }        

        audioElement.src = `file://${path.join(musicPath, secondfilename)}`;
        audioElement.volume = volumeControl.value / 100;
        audioElement.playbackRate = rememberspeed;

        if (isLooping == true) {audioElement.loop = true} 
        else {audioElement.loop = false}

        await audioElement.play();
        playButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';

        const fileNameWithoutExtension = path.parse(file.name).name;
        const encodedFileName = encodeURIComponent(fileNameWithoutExtension);
        const decodedFileName = decodeURIComponent(encodedFileName);
        const thumbnailFolder = path.join(taratorFolder, 'thumbnails');
        const thumbnailFileName = `${decodedFileName}_thumbnail.jpg`;
        const thumbnailPath = path.join(taratorFolder, 'thumbnails', thumbnailFileName.replace(/%20/g, ' '));
        let thumbnailUrl = path.join(thumbnailFolder, '_____placeholder.jpg'.replace(/%20/g, ' '));

        if (fs.existsSync(thumbnailPath)) {
            thumbnailUrl = `file://${thumbnailPath.replace(/\\/g, '/')}`;
        } else {
            console.log("Tried to get thumbnail from", thumbnailPath, "but failed. Used", thumbnailUrl, "instead.");
        }

        videothumbnailbox.style.backgroundImage = `url('${thumbnailUrl}')`; 
        const playingElements = document.querySelectorAll('.music-item.playing');
        playingElements.forEach(element => { element.classList.remove('playing'); });

        document.querySelectorAll('.music-item').forEach(musicElement => {
            if (musicElement.getAttribute('data-file-name').slice(0, -4) == songName.innerHTML) {
                musicElement.classList.add('playing'); 
            }
        });

        currentPlayingElement = songName;     
        currentPlayingElement.setAttribute('data-file-name', secondfilename);     
        updateDiscordPresence();
        if (isShuffleActive) {
            if (currentPlaylist) {
                if (havuc != currentPlaylist.name) {
                    havuc = currentPlaylist.name;
                    playlistPlayedSongs.splice(0, maximumPreviousSongCount);
                }
                playlistPlayedSongs.unshift(songName.innerHTML);
                if (playlistPlayedSongs.length > maximumPreviousSongCount) { playlistPlayedSongs.pop(); }
            } else {
                playedSongs.unshift(songName.innerHTML);
                if (playedSongs.length > maximumPreviousSongCount) { playedSongs.pop(); }
            }
        }

        return new Promise((resolve) => {
            audioElement.addEventListener('ended', () => {
                songDuration = 0;
                resolve();
            }, { once: true });
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

function manageAudioControls(audioElement) {
    const videoLength = document.getElementById('video-length');
    const videoProgress = document.getElementById('video-progress');
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');

    volumeControl.addEventListener('input', () => {
        audioElement.volume = volumeControl.value / 100;
        localStorage.setItem('volume', volumeControl.value);
    });

    audioElement.addEventListener('loadedmetadata', () => {
        videoProgress.value = 0;
        const duration = formatTime(audioElement.duration);
        videoLength.textContent = `00:00 / ${duration}`;        
    });

    audioElement.addEventListener('timeupdate', () => {
        const currentTime = formatTime(audioElement.currentTime);
        const duration = formatTime(audioElement.duration);
        videoLength.textContent = `${currentTime} / ${duration}`;    
        videoProgress.value = (audioElement.currentTime / audioElement.duration) * 100;
        updateDiscordPresence();
    });

    playButton.addEventListener('click', () => {
        audioElement.play();
        playButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
    });
    
    pauseButton.addEventListener('click', () => {
        audioElement.pause();
        pauseButton.style.display = 'none';
        playButton.style.display = 'inline-block';
    });

    audioElement.addEventListener('ended', () => {
        pauseButton.style.display = 'none';
        playButton.style.display = 'inline-block';
        if (isAutoplayActive) { playNextSong() }
    });

    videoProgress.addEventListener('input', () => {
        const seekTime = (audioElement.duration * videoProgress.value) / 100;
        audioElement.currentTime = seekTime;
        updateDiscordPresence();
    });
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    const minutesDisplay = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secondsDisplay = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutesDisplay}:${secondsDisplay}`;
}

function createPlaylistElement(playlist) {
    const playlistElement = document.createElement('div');
    playlistElement.className = 'playlist';
    playlistElement.setAttribute('data-playlist-name', playlist.name);
    
    let thumbnailSrc = '';
    if (playlist.thumbnail) {
        thumbnailSrc = playlist.thumbnail;
    } else if (playlist.songs && playlist.songs.length > 0) {
        const fileNameWithoutExtension = path.parse(playlist.songs[0]).name;
        const thumbnailFolder = path.join(taratorFolder, 'thumbnails');
        const thumbnailFileName = `${fileNameWithoutExtension}_thumbnail.jpg`;
        const thumbnailPath = path.join(thumbnailFolder, thumbnailFileName.replace(/%20/g, ' '));
        
        if (fs.existsSync(thumbnailPath)) {
            thumbnailSrc = `file://${thumbnailPath.replace(/\\/g, '/')}`;
        } else {
            thumbnailSrc = `file://${path.join(thumbnailFolder, '_placeholder.jpg').replace(/\\/g, '/')}`;
            console.log(`Failed to find thumbnail for playlist ${playlist.name}. Using placeholder.`);
        }
    } else {
        thumbnailSrc = `file://${path.join(taratorFolder, 'thumbnails', '_placeholder.jpg').replace(/\\/g, '/')}`;
    }
    
    const thumbnail = document.createElement('img');
    thumbnail.src = thumbnailSrc;
    playlistElement.appendChild(thumbnail); 

    const playlistInfoandSongs = document.createElement('div');
    playlistElement.appendChild(playlistInfoandSongs);
    playlistInfoandSongs.className = 'playlistInfoandSongs';

    const playlistInfo = document.createElement('div');
    playlistInfoandSongs.appendChild(playlistInfo);
    playlistInfo.className = 'playlist-info';

    const playlistName = document.createElement('div');
    const playlistLength = document.createElement('div');
    playlistName.textContent = playlist.name;
    if (playlist.songs.length == 1) {
        playlistLength.textContent = playlist.songs.length + " song";
    } else {
        playlistLength.textContent = playlist.songs.length + " songs";
    }    
    playlistInfo.appendChild(playlistName);
    playlistInfo.appendChild(playlistLength);

    const playlistSongs = document.createElement('div');
    const playlistButtons = document.createElement('div');
    playlistInfoandSongs.appendChild(playlistSongs);
    playlistElement.appendChild(playlistButtons);
    playlistSongs.className = 'playlist-songs';
    playlistButtons.className = 'playlist-buttons';

    const playlistCustomiseButton = document.createElement('div');
    playlistButtons.appendChild(playlistCustomiseButton);
    playlistCustomiseButton.className = 'playlist-buttons-button';
    playlistCustomiseButton.innerHTML = icon.custom

    playlistCustomiseButton.addEventListener('click', () => { 
        let theNameOfThePlaylist = playlist.name;
        editPlaylistModal.style.display = 'block';
        document.getElementById('editPlaylistNameInput').value = theNameOfThePlaylist;
        document.getElementById('editInvisibleName').value = theNameOfThePlaylist;
        document.getElementById('editPlaylistThumbnail').src = thumbnailSrc;
        document.getElementById('editInvisiblePhoto').src = thumbnailSrc;
    });    

    for (let i = 0; i < playlist.songs.length; i++) {
        const playlistSong = document.createElement('div');
        playlistSong.textContent = playlist.songs[i];
        playlistSongs.appendChild(playlistSong);
        playlistSong.className = 'playlist-song';

        playlistSong.addEventListener('click', () => { 
            playPlaylist(playlist, i);
        }); 
    }

    thumbnail.addEventListener('click', () => { 
        playPlaylist(playlist, 0);
    });    

    return playlistElement;
}

function saveEditPlaylist() {
    const oldName = document.getElementById('editInvisibleName').value;
    const newName = document.getElementById('editPlaylistNameInput').value;
    const newThumbnail = document.getElementById('editPlaylistThumbnail').src;

    const filePath = path.join(taratorFolder, 'playlists.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        let playlists;
        try {
            playlists = JSON.parse(data);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            return;
        }

        const playlist = playlists.find(pl => pl.name === oldName);
        if (playlist) {
            playlist.name = newName;

            if (newThumbnail.startsWith('data:image')) {
                const base64Data = newThumbnail.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const thumbnailsDir = path.join(taratorFolder, 'thumbnails');
                const newThumbnailPath = path.join(thumbnailsDir, `${newName}_playlist.jpg`);

                if (!fs.existsSync(thumbnailsDir)) { fs.mkdirSync(thumbnailsDir, { recursive: true }); }

                fs.writeFile(newThumbnailPath, buffer, (writeErr) => {
                    if (writeErr) {
                        console.error('Error saving thumbnail:', writeErr);
                        return;
                    }
                    console.log('Thumbnail saved successfully:', newThumbnailPath);

                    playlist.thumbnail = newThumbnailPath;

                    fs.writeFile(filePath, JSON.stringify(playlists, null, 2), 'utf8', (writeErr) => {
                        if (writeErr) {
                            console.error('Error writing file:', writeErr);
                            return;
                        }
                        console.log('Playlist updated successfully');
                    });
                });
            } else {
                playlist.thumbnail = newThumbnail;

                fs.writeFile(filePath, JSON.stringify(playlists, null, 2), 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error('Error writing file:', writeErr);
                        return;
                    }
                    console.log('Playlist updated successfully');
                });
            }
        } else {
            console.error('Playlist not found:', oldName);
            return;
        }
    });
    document.getElementById('my-music').click();
    document.getElementById('playlists').click();
}

function displayPlaylists(playlists) {
    const playlistsContent = document.getElementById('playlists-content');
    playlistsContent.innerHTML = '';

    playlists.forEach(playlist => {
        const playlistElement = createPlaylistElement(playlist);
        playlistsContent.appendChild(playlistElement);
    });
}

document.getElementById('playlists').addEventListener('click', () => {
    ipcRenderer.send('get-playlists');
});

ipcRenderer.on('send-playlists', (event, playlists) => {
    if (!Array.isArray(playlists)) {
        console.error('Received invalid playlists data:', playlists);
        playlists = [];
    }
    displayPlaylists(playlists);
});

ipcRenderer.on('playlist-created', (event, newPlaylist) => {    
    ipcRenderer.send('get-playlists');
    closeModal();
});

ipcRenderer.on('playlist-creation-error', (event, errorMessage) => {
    createPlaylistModal.style.display = 'block';
    const modalFooter = document.querySelector('#modalerror');    
    modalFooter.innerHTML = ''; 

    const errorElement = document.createElement('p');
    errorElement.className = 'error-message';
    errorElement.textContent = errorMessage;
    modalFooter.appendChild(errorElement);
});

function openAddToPlaylistModal(songName) {
    document.getElementById('addToPlaylistModal').style.display = 'block';
    const playlistsContainer = document.getElementById('playlist-checkboxes');
    playlistsContainer.innerHTML = '';
    patates = songName.slice(0,-4);

    ipcRenderer.send('get-playlists');
    ipcRenderer.once('send-playlists', (event, playlists) => {
        playlists.forEach(playlist => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = playlist.name;
            checkbox.value = songName;  
            const label = document.createElement('label');
            label.textContent = playlist.name;
            label.htmlFor = checkbox.id; 

            playlistsContainer.appendChild(checkbox);
            playlistsContainer.appendChild(label);
            playlistsContainer.appendChild(document.createElement('br'));
        });
    }); 
}

function addToSelectedPlaylists(patates) {
    const checkboxes = document.querySelectorAll('#playlist-checkboxes input[type="checkbox"]');
    const selectedPlaylists = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.id);  

    selectedPlaylists.forEach(playlistName => { ipcRenderer.send('add-to-playlist', { playlistName, patates }); });
    closeModal();
}

async function playPlaylist(playlist, startingIndex = 0) {
    if (!playlist.songs || playlist.songs.length === 0) {
        console.error(`Playlist ${playlist.name} is empty.`);
        return;
    }

    currentPlaylist = playlist;
    
    for (let i = startingIndex; i < playlist.songs.length; i++) {
        let songName = playlist.songs[i];        
        const file = { name: songName };
        currentPlaylistElement = i;
        const clickedElement = document.querySelector(`.music-item[data-file-name="${songName}.mp3"]`);
        await playMusic(file, clickedElement, true);
    }
}

function playPreviousSong() {
    if (currentPlayingElement) {
        if (isShuffleActive) {
            if (currentPlaylist) {
                if (playlistPlayedSongs.length > 1) {    
                    const previousSongName = playlistPlayedSongs[1];
                    const previousElement = document.querySelector(`.music-item[data-file-name="${previousSongName}.mp3"]`);
                    const file = { name: previousSongName };
                    playMusic(file, previousElement, true);
                    playlistPlayedSongs.splice(0, 2);
                }                
            } else {
                if (playedSongs.length > 1) {    
                    const previousSongName = playedSongs[1];
                    const previousElement = document.querySelector(`.music-item[data-file-name="${previousSongName}.mp3"]`);
                    const file = { name: previousSongName };
                    playMusic(file, previousElement, true);
                    playedSongs.splice(0, 2);
                }
            }
        } else {
            if (currentPlaylist) {
                if (currentPlaylistElement > 0) {
                    const previousSongName = currentPlaylist.songs[currentPlaylistElement - 1];
                    const previousElement = document.querySelector(`.music-item[data-file-name="${previousSongName}.mp3"]`);
                    const file = { name: previousSongName };
                    playMusic(file, previousElement, true);
                    currentPlaylistElement--;
                }
            } else {
                const previousElement = document.querySelector(`.music-item[data-file-name="${(document.getElementById('song-name').innerText)}.mp3"]`).previousElementSibling;
                const previousFileName = previousElement.getAttribute('data-file-name');
                const file = { name: previousFileName };
                playMusic(file, document.querySelector(`.music-item[data-file-name="${previousFileName}.mp3"]`), true);
            }
        }
    }
}

function playNextSong() {
    if (currentPlayingElement) {
        let nextSongName;        
        if (isShuffleActive) {
            if (currentPlaylist) {
                const currentSongName = currentPlaylist.songs[currentPlaylistElement];
                let randomIndex = Math.floor(Math.random() * currentPlaylist.songs.length);
                
                while (currentPlaylist.songs[randomIndex] === currentSongName) {
                    randomIndex = Math.floor(Math.random() * currentPlaylist.songs.length);
                }
                
                nextSongName = currentPlaylist.songs[randomIndex];
                currentPlaylistElement = randomIndex;
            } else {
                const musicItems = Array.from(document.querySelectorAll('.music-item'));
                const currentFileName = currentPlayingElement.getAttribute('data-file-name');
                let randomIndex = Math.floor(Math.random() * musicItems.length);
                
                while (musicItems[randomIndex].getAttribute('data-file-name') === currentFileName) {
                    randomIndex = Math.floor(Math.random() * musicItems.length);
                }
                
                nextSongName = musicItems[randomIndex].getAttribute('data-file-name');
            }
        } else {
            if (currentPlaylist) {
                if (currentPlaylistElement < currentPlaylist.songs.length - 1) {
                    nextSongName = currentPlaylist.songs[currentPlaylistElement + 1];
                    currentPlaylistElement++;
                }
            } else {
                const nextElement = document.querySelector(`.music-item[data-file-name="${(document.getElementById('song-name').innerText)}.mp3"]`).nextElementSibling;
                nextSongName = nextElement.getAttribute('data-file-name');
            }
        }

        if (nextSongName) {
            const file = { name: nextSongName };
            playMusic(file, document.querySelector(`.music-item[data-file-name="${nextSongName}.mp3"]`), true);
        }
    }
}

function randomSongFunctionMainMenu() {
    const musicItems = Array.from(document.querySelectorAll('.music-item'));
    let randomIndex = Math.floor(Math.random() * musicItems.length);
    
    nextSongName = musicItems[randomIndex].getAttribute('data-file-name');
    const file = { name: nextSongName };
    playMusic(file, document.querySelector(`.music-item[data-file-name="${nextSongName}.mp3"]`), true);
}

let rememberautoplay = JSON.parse(localStorage.getItem('rememberautoplay')) || false;
if (rememberautoplay == true) {toggleAutoplay()}
let remembershuffle = JSON.parse(localStorage.getItem('remembershuffle')) || false;
if (remembershuffle == true) {toggleShuffle()}
let rememberloop = JSON.parse(localStorage.getItem('rememberloop')) || false;
if (rememberloop == true) {loop()}
let rememberspeed = JSON.parse(localStorage.getItem('rememberspeed')) || 1;

function toggleAutoplay() {
    isAutoplayActive = !isAutoplayActive;
    const autoplayButton = document.getElementById('autoplayButton');
    if (isAutoplayActive) {
        autoplayButton.classList.add('active');
        autoplayButton.innerHTML = icon.greenAutoplay
        localStorage.setItem('rememberautoplay', true);
    } else {
        autoplayButton.classList.remove('active');
        autoplayButton.innerHTML = icon.redAutoplay
        localStorage.setItem('rememberautoplay', false);
    }
}

function toggleShuffle() {
    isShuffleActive = !isShuffleActive;
    const shuffleButton = document.getElementById('shuffleButton');
    if (isShuffleActive) {
        shuffleButton.classList.add('active');
        shuffleButton.innerHTML = icon.greenShuffle   
        localStorage.setItem('remembershuffle', true);   
    } else {
        shuffleButton.classList.remove('active');
        shuffleButton.innerHTML = icon.redShuffle
        localStorage.setItem('remembershuffle', false);
    }
}

function loop() {
    if (isLooping) {
        isLooping = false;        
        loopButton.innerHTML = icon.redLoop;
        localStorage.setItem('rememberloop', false);
        if (audioElement) {
            audioElement.loop = false;
        }
    } else {
        isLooping = true;        
        loopButton.innerHTML = icon.greenLoop;
        localStorage.setItem('rememberloop', true);
        if (audioElement) {
            audioElement.loop = true;
        }
    }
}

function mute() {
    if (audioElement) {
        if (audioElement.volume !== 0) {
            previousVolume = volumeControl.value;
            audioElement.volume = 0;
            volumeControl.value = 0;
            muteButton.classList.add('active');
        } else {
            audioElement.volume = previousVolume / 100;
            volumeControl.value = previousVolume;
            muteButton.classList.remove('active');
        }
        localStorage.setItem('volume', volumeControl.value);
    }
}

function speed() { 
    document.getElementById('speedOptions').innerHTML = '';
    speedModal.style.display = 'block';
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    speeds.forEach(speed => {
        const speedOption = document.createElement('div');
        speedOption.classList.add('speed-option');
        speedOption.textContent = `${speed}x`;
        if (speed == rememberspeed) {speedOption.style.color = 'red'}
        speedOption.addEventListener('click', () => {
            rememberspeed = speed;
            localStorage.setItem('rememberspeed', speed);
            if (audioElement) {audioElement.playbackRate = rememberspeed;}
            closeModal();            
        });
        speedOptions.appendChild(speedOption);
    });
}

function skipForward() {
    if (audioElement) {
        audioElement.currentTime = Math.min(audioElement.currentTime + 5, audioElement.duration);
    }
}

function skipBackward() {
    if (audioElement) {
        audioElement.currentTime = Math.max(audioElement.currentTime - 5, 0);
    }
}

function createNewPlaylist() { 
    createPlaylistModal.style.display = 'block'; 
}

function downloadNew() { 
    downloadModal.style.display = 'block';
    document.getElementById('downloadFirstInput').value = '';

    if (document.getElementById('downloadSecondPhase')) {
        document.getElementById('downloadSecondPhase').remove();
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

document.getElementById('savePlaylistButton').addEventListener('click', () => {
    const playlistName = document.getElementById('playlistNameInput').value;
    let thumbnailFilePath = null;

    const thumbnailInput = document.getElementById('thumbnailInput');
    if (thumbnailInput.files.length > 0) {
        thumbnailFilePath = thumbnailInput.files[0].path;
    } else {
        dialog.showErrorBox('Thumbnail Error', 'Please select a thumbnail for the playlist.');
        return;
    }

    ipcRenderer.send('create-playlist', {
        playlistName,
        thumbnailFilePath
    });
});

function openCustomizeModal(songName, thumbnailUrl) {
    customizeModal.style.display = 'block';
    document.getElementById('customizeSongName').value = songName.slice(0, -4);
    const oldThumbnailPath = path.join(taratorFolder, 'thumbnails', songName + '_thumbnail.jpg');
    const customizeForm = document.getElementById('customizeForm');
    document.getElementById('customiseImage').src = path.join(taratorFolder, 'thumbnails', songName.slice(0, -4) + '_thumbnail.jpg');
    customizeForm.dataset.oldSongName = songName;
    customizeForm.dataset.oldThumbnailPath = oldThumbnailPath;
    domates = songName;
    domates2 = domates.slice(0, -4) + '_thumbnail.jpg'
}

document.getElementById('customizeForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const oldSongName = document.getElementById('customizeForm').dataset.oldSongName;
    const oldThumbnailPath = document.getElementById('customizeForm').dataset.oldThumbnailPath.replace('.mp3', '');    
    const newSongName = document.getElementById('customizeSongName').value;
    const newThumbnailFile = document.getElementById('customizeThumbnail').files[0];    
    const userDesktop = path.join(taratorFolder, 'musics'); // TODO: Confusing name
    const oldSongFilePath = path.join(userDesktop, oldSongName);    
    let newSongFilePath = path.join(userDesktop, newSongName + path.extname(oldSongName));
    
    if (fs.existsSync(oldSongFilePath)) {
        fs.renameSync(oldSongFilePath, newSongFilePath);
    } else {
        console.error('Old song file does not exist:', oldSongFilePath);
        return;
    }

    if (newThumbnailFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const newThumbnailPath = path.join(path.dirname(oldThumbnailPath), newSongName + '_thumbnail.jpg');            
            const base64Data = e.target.result.replace(/^data:image\/jpeg;base64,/, "");
            fs.writeFileSync(newThumbnailPath, base64Data, 'base64');
            
            if (fs.existsSync(oldThumbnailPath)) {
                fs.unlinkSync(oldThumbnailPath);
            }
        };
        reader.readAsDataURL(newThumbnailFile);
    } else {
        const newThumbnailPath = path.join(path.dirname(oldThumbnailPath), newSongName + '_thumbnail.jpg');
        if (fs.existsSync(oldThumbnailPath)) {
            fs.renameSync(oldThumbnailPath, newThumbnailPath);
        } else {
            console.error('Old thumbnail file does not exist:', oldThumbnailPath);
        }
    }

    const playlistsFilePath = path.join(taratorFolder, 'playlists.json');
    if (fs.existsSync(playlistsFilePath)) {
        let playlistsData = fs.readFileSync(playlistsFilePath, 'utf8');
        playlistsData = JSON.parse(playlistsData);
        
        for (const playlist of playlistsData) {
            console.log("Checking Playlist");
            for (let i = 0; i < playlist.songs.length; i++) {
                if (playlist.songs[i] == oldSongName) {
                    playlist.songs[i] = newSongName+".mp3";
                }
            }
        }
        
        fs.writeFileSync(playlistsFilePath, JSON.stringify(playlistsData, null, 2));
    } else {
        console.error('playlists.json file does not exist:', playlistsFilePath);
    }

    customizeModal.style.display = 'none';    
    document.getElementById('my-music').click();
});

function checkNameThumbnail() {
    document.getElementById('downloadFirstButton').disabled = true;

    const downloadSecondPhase = document.createElement('div');     
    downloadSecondPhase.id = 'downloadSecondPhase';
    document.getElementById('downloadModalContent').appendChild(downloadSecondPhase);

    const downloadModalBottomRow = document.createElement('div');    
    downloadModalBottomRow.id = 'downloadModalBottomRow';
    document.getElementById('downloadSecondPhase').appendChild(downloadModalBottomRow); 

    const downloadModalText = document.createElement('div');
    downloadModalText.id = 'downloadModalText';
    downloadModalBottomRow.appendChild(downloadModalText);    
    document.getElementById('downloadModalText').innerHTML = "Checking...";

    if (document.getElementById('downloadFirstInput').value.trim() === '') {
        document.getElementById('downloadModalText').innerHTML = "The input can not be empty.";
        document.getElementById('downloadFirstButton').disabled = false;
        return;
    }

    if (differentiateYouTubeLinks(document.getElementById('downloadFirstInput').value) == 'video') {
        const pythonProcessTitle = spawn('python', [ path.join(taratorFolder, 'pypy1.py'), document.getElementById('downloadFirstInput').value ]);
        pythonProcessTitle.stdout.on('data', (data) => {
            const decodedData = data.toString().trim();
            let decodedString;
            try { decodedString = JSON.parse(decodedData); } 
            catch (error) { decodedString = decodedData; }

            const pythonProcessThumbnail2 = spawn('python', [path.join(taratorFolder, 'pypy2.py'), document.getElementById('downloadFirstInput').value]);
            pythonProcessThumbnail2.stdout.on('data', (data) => {                
                const downloadPlaceofSongs = document.createElement('div');
                document.getElementById('downloadSecondPhase').appendChild(downloadPlaceofSongs);
                downloadPlaceofSongs.className = 'flexrow';
                downloadPlaceofSongs.id = 'downloadPlaceofSongs';

                const songAndThumbnail = document.createElement('div');
                songAndThumbnail.className = 'songAndThumbnail';
                downloadPlaceofSongs.appendChild(songAndThumbnail);

                const exampleDownloadColumn = document.createElement('div');
                exampleDownloadColumn.className = 'exampleDownloadColumn';

                const downloadSecondInput = document.createElement('input');
                downloadSecondInput.type = 'text';
                downloadSecondInput.id = 'downloadSecondInput';
                downloadSecondInput.value = decodedString;

                const thumbnailInput = document.createElement('input');
                thumbnailInput.type = 'file';
                thumbnailInput.id = 'thumbnailInput';
                thumbnailInput.accept = 'image/*';
                thumbnailInput.onchange = function(event) { updateThumbnailImage(event, 3); };

                const thumbnailImage = document.createElement('img');
                thumbnailImage.id = 'thumbnailImage';
                thumbnailImage.className = 'thumbnailImage';
                thumbnailImage.src = data.toString().trim();
                thumbnailImage.alt = '';
                
                songAndThumbnail.appendChild(exampleDownloadColumn);   
                exampleDownloadColumn.appendChild(downloadSecondInput);
                exampleDownloadColumn.appendChild(thumbnailInput);
                songAndThumbnail.appendChild(thumbnailImage);
                document.getElementById('downloadModalText').innerHTML = "";
                document.getElementById('downloadFirstButton').disabled = false;
                document.getElementById('downloadSecondPhase').style.display = 'block';
                const finalDownloadButton = document.createElement('button');
                finalDownloadButton.id = 'finalDownloadButton';
                finalDownloadButton.onclick = function() { actuallyDownloadTheSong(); };
                finalDownloadButton.textContent = 'Download';
                downloadModalBottomRow.appendChild(finalDownloadButton);
            });            
            pythonProcessThumbnail2.stderr.on('data', (data) => { console.error(`Error: ${data}`); });
            pythonProcessThumbnail2.on('close', (code) => { console.log(`Python process exited with code ${code}`); });
        });
        pythonProcessTitle.stderr.on('data', (data) => { console.error(`Error: ${data}`); });
        pythonProcessTitle.on('close', (code) => { console.log(`Python process exited with code ${code}`); });

    } else if (differentiateYouTubeLinks(document.getElementById('downloadFirstInput').value) == 'playlist') {
        const pythonProcessTitle = spawn('python', [ path.join(taratorFolder, 'pypy3.py'), document.getElementById('downloadFirstInput').value ]);    
        pythonProcessTitle.stdout.on('data', (data) => {
            decodedData = data.toString().trim();
            
            try { decodedJson = JSON.parse(decodedData); } 
            catch (error) { console.error('Error parsing JSON:', error); return; }
            if (decodedJson.error) { console.error('Python script error:', decodedJson.error); return; }

            const pythonProcessThumbnail2 = spawn('python', [ path.join(taratorFolder, 'pypy4.py'), document.getElementById('downloadFirstInput').value ]);
            pythonProcessThumbnail2.stdout.on('data', (data) => {
                decodedData2 = data.toString().trim();
                
                try { decodedJson2 = JSON.parse(decodedData2); }
                catch (error) { console.error('Error parsing JSON:', error); return; }
                if (decodedJson2.error) { console.error('Python script error:', decodedJson2.error); return; }

                const downloadPlaceofSongs = document.createElement('div');
                downloadPlaceofSongs.id = 'downloadPlaceofSongs';
                document.getElementById('downloadSecondPhase').appendChild(downloadPlaceofSongs);

                const theInvisibleArray = document.createElement('div');
                document.getElementById('downloadSecondPhase').appendChild(theInvisibleArray);
                theInvisibleArray.id = 'theInvisibleArray'; 
                theInvisibleArray.className = 'invisible';
                let pizza = 0;

                const python3 = spawn('python', [ path.join(taratorFolder, 'pypy9.py'), document.getElementById('downloadFirstInput').value ]);
                python3.stdout.on('data', (data) => { 
                    let pypy9output = JSON.parse(data.toString().trim().replace(/'/g, '"'));
        
                    for (i = 0; i < decodedJson.length; i++) {
                        const songAndThumbnail = document.createElement('div');
                        songAndThumbnail.className = 'songAndThumbnail';
                        songAndThumbnail.id = 'songAndThumbnail' + i;
                        downloadPlaceofSongs.appendChild(songAndThumbnail);                        

                        const exampleDownloadColumn = document.createElement('div');
                        exampleDownloadColumn.className = 'exampleDownloadColumn';
                        songAndThumbnail.appendChild(exampleDownloadColumn);
        
                        const downloadSecondInput = document.createElement('input');
                        downloadSecondInput.type = 'text';
                        downloadSecondInput.className = 'playlistTitle';
                        downloadSecondInput.id = 'playlistTitle' + i;
                        downloadSecondInput.value = decodedJson[i];
                        exampleDownloadColumn.appendChild(downloadSecondInput);

                        if (i == 0) {
                            const saveAsPlaylist = document.createElement('button');
                            saveAsPlaylist.id = 'saveAsPlaylist';
                            saveAsPlaylist.innerHTML = "saveAsPlaylist";
                            songAndThumbnail.appendChild(saveAsPlaylist);
                            saveAsPlaylist.style.backgroundColor = 'red';

                            saveAsPlaylist.onclick = function() {
                                if (isSaveAsPlaylistActive) {
                                    saveAsPlaylist.style.backgroundColor = 'red';
                                    isSaveAsPlaylistActive = false;
                                } else {
                                    saveAsPlaylist.style.backgroundColor = 'green';
                                    isSaveAsPlaylistActive = true;
                                }
                            };
                        } else {
                            const deleteThisPlaylistSong = document.createElement('button');
                            deleteThisPlaylistSong.id = 'deleteThisPlaylistSong' + i;
                            deleteThisPlaylistSong.innerHTML = "Delete";
                            songAndThumbnail.appendChild(deleteThisPlaylistSong);
                            deleteThisPlaylistSong.onclick = function() { this.parentNode.remove(); };
                        }                        
        
                        const thumbnailInput = document.createElement('input');
                        thumbnailInput.type = 'file';
                        thumbnailInput.className = 'thumbnailInput';
                        thumbnailInput.id = 'thumbnailInput' + i;
                        thumbnailInput.accept = 'image/*';
                        thumbnailInput.onchange = function(event) { updateThumbnailImage(event, playlist.playlist_id); }; // çalışmıyor. ( galiba )
                        exampleDownloadColumn.appendChild(thumbnailInput);
        
                        const thumbnailImage = document.createElement('img');
                        thumbnailImage.className = 'thumbnailImage';
                        thumbnailImage.id = 'thumbnailImage' + i;
                        if (i == 0) { thumbnailImage.src = decodedJson2[1];} 
                        else {
                            thumbnailImage.src = decodedJson2[i];
                            songAndThumbnail.dataset.link = pypy9output[i-1];
                        }
                        thumbnailImage.alt = '';
                        songAndThumbnail.appendChild(thumbnailImage);
                        pizza++;
                    }
                    
                    theInvisibleArray.textContent = decodedJson.length;
                    document.getElementById('downloadModalText').innerHTML = "";
                    document.getElementById('downloadFirstButton').disabled = false;
                    document.getElementById('downloadSecondPhase').style.display = 'block';
                    const finalDownloadButton = document.createElement('button');
                    finalDownloadButton.id = 'finalDownloadButton';
                    finalDownloadButton.onclick = function() { actuallyDownloadTheSong(); };
                    finalDownloadButton.textContent = 'Download';
                    downloadModalBottomRow.appendChild(finalDownloadButton);
                });
            });
            pythonProcessThumbnail2.stderr.on('data', (data) => { console.error(`Error: ${data}`); }); // TODO: Removelanabilir?
            pythonProcessThumbnail2.on('close', (code) => { console.log(`Python process exited with code ${code}`); });
        });
        pythonProcessTitle.stderr.on('data', (data) => { console.error(`Error: ${data}`); });
        pythonProcessTitle.on('close', (code) => { console.log(`Python process exited with code ${code}`); });        
    } else {
        document.getElementById('downloadModalText').innerHTML = "Link neither a video or playlist.";
        document.getElementById('downloadFirstButton').disabled = false;
        document.getElementById('downloadSecondPhase').style.display = 'block';
    }
}

function isValidFileName(fileName) {
    const invalidChars = /[\\/:"*?<>|,]/; 
    return !invalidChars.test(fileName);
}

function fileExists(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
}

function actuallyDownloadTheSong() {    
    document.getElementById('finalDownloadButton').disabled = true;
    if (differentiateYouTubeLinks(document.getElementById('downloadFirstInput').value) == 'video') {
        const secondInput = document.getElementById('downloadSecondInput').value.trim();
        const outputFilePath = path.join(taratorFolder, 'musics', `${secondInput}.mp3`);
        const img = document.getElementById('thumbnailImage');
        if (!isValidFileName(secondInput)) {
            document.getElementById('downloadModalText').innerText = ('Invalid characters in filename. These characters cannot be used in filenames: / \\ : * ? " < > | ,');
            document.getElementById('finalDownloadButton').disabled = false;
            return;
        } else if (fileExists(outputFilePath)) {
            document.getElementById('downloadModalText').innerText = (`File ${secondInput}.mp3 already exists. Please choose a different filename.`);
            document.getElementById('finalDownloadButton').disabled = false;
            return;
        } else { document.getElementById('downloadModalText').innerText = "Downloading Song..."}
                const pythonProcessFileName = spawn('python', [ path.join(taratorFolder, 'pypy5.py'), document.getElementById('downloadFirstInput').value, secondInput ]);
                pythonProcessFileName.stdout.on('data', (data) => {
                    const decodedData = data.toString().trim();
                    let parsedData;
                    try { parsedData = JSON.parse(decodedData); } 
                    catch (error) { console.error(`Error parsing JSON: ${error}`); parsedData = { error: 'Invalid JSON' }; }
                    document.getElementById('downloadModalText').innerText = parsedData.message || parsedData.error || 'Unknown response';
                    fetch(img.src)
                    .then(res => res.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = function() {
                            const base64data = reader.result;
                            const tempFilePath = path.join(taratorFolder, 'temp_thumbnail.txt');
                            fs.writeFileSync(tempFilePath, base64data);

                            const pythonProcessFileThumbnail = spawn('python', [ path.join(taratorFolder, 'pypy6.py'), tempFilePath, secondInput ]);
                            pythonProcessFileThumbnail.stdout.on('data', (data) => {
                                const decodedData = data.toString().trim();
                                let parsedData;
                                try { parsedData = JSON.parse(decodedData); } 
                                catch (error) { console.error(`Error parsing JSON: ${error}`); parsedData = { error: 'Invalid JSON' }; }
                                document.getElementById('downloadModalText').innerText = document.getElementById('downloadModalText').innerText + (parsedData.message || parsedData.error || 'Unknown response');
                                document.getElementById('finalDownloadButton').disabled = false;
                            });

                            pythonProcessFileThumbnail.stderr.on('data', (data) => { console.error(`Error: ${data}`); });
                            pythonProcessFileThumbnail.on('close', (code) => { console.log(`Python process exited with code ${code}`); fs.unlinkSync(tempFilePath); });
                        };
                        reader.readAsDataURL(blob);
                    }).catch(error => console.error(`Error: ${error}`));
        });
        pythonProcessFileName.stderr.on('data', (data) => { console.error(`Error: ${data}`); });
        pythonProcessFileName.on('close', (code) => { console.log(`Python process exited with code ${code}`); });

    } else if (differentiateYouTubeLinks(document.getElementById('downloadFirstInput').value) == 'playlist') {        
        let playlistInitialSongCount = document.getElementById('theInvisibleArray').innerText;
        let theArrayThatIWillGiveToPython = [];
        if (!isValidFileName(document.getElementById('playlistTitle0').value)) {
            document.getElementById('downloadModalText').innerText = (`Invalid characters in the playlist name. These characters cannot be used in filenames: / \\ : * ? " < > | ,`); 
            document.getElementById('finalDownloadButton').disabled = false;
            return;
        }
        for (i = 1; i < playlistInitialSongCount; i++) {
            if (document.getElementById('playlistTitle' + i)) { 
                if (!isValidFileName(document.getElementById('playlistTitle' + i).value)) {
                    document.getElementById('downloadModalText').innerText = (`Invalid characters in ${i}. song's name. These characters cannot be used in filenames: / \\ : * ? " < > | ,`); 
                    document.getElementById('finalDownloadButton').disabled = false;
                    return;
                } // TODO: FILE EXISTS !!!!
                // VE BAŞKA Bİ ŞARKIYLA İSMİ AYNI MI DİYE DE BAKSIN !!!
                theArrayThatIWillGiveToPython[i-1] = (document.getElementById('playlistTitle' + i).value.trim())
            } else {
                theArrayThatIWillGiveToPython[i-1] = "None";
            }
        }

        saveeeAsPlaylist(theArrayThatIWillGiveToPython);
        let howManyAreThere = document.querySelectorAll('div.songAndThumbnail').length;

        const pythonProcessTitle = spawn('python', [ path.join(taratorFolder, 'pypy7.py'), theArrayThatIWillGiveToPython, document.getElementById('downloadFirstInput').value.trim()]);
        pythonProcessTitle.stdout.on('data', (data) => {
            document.getElementById('downloadModalText').innerText = data.toString().trim();

            let peynir = 1;
            let j = 1;

            while (peynir < howManyAreThere) {
                if (document.getElementById(`thumbnailImage${j}`)) {
                    let img = document.getElementById(`thumbnailImage${j}`);
                    let songName = document.getElementById(`playlistTitle${j}`).value;
                    peynir++;
                    fetch(img.src)
                        .then(res => res.blob())
                        .then(blob => {
                            let reader = new FileReader();
                            reader.onloadend = function() {
                                let base64data = reader.result;
                                let tempFilePath = path.join(taratorFolder, `temp_thumbnail_${songName}.txt`);
                                try {
                                    fs.writeFileSync(tempFilePath, base64data);
                                    let pythonProcess = spawn('python', [path.join(taratorFolder, 'pypy6.py'), tempFilePath, songName]);

                                    pythonProcess.stdout.on('data', (data) => {
                                        let decodedData = data.toString().trim();
                                        let parsedData;
                                        try { parsedData = JSON.parse(decodedData); } 
                                        catch (error) { 
                                            console.error(`Error parsing JSON: ${error}`); 
                                            parsedData = { error: 'Invalid JSON' }; 
                                        }
                                        document.getElementById('downloadModalText').innerText += (parsedData.message || parsedData.error || 'Unknown response') + '\n';
                                    });

                                    pythonProcess.stderr.on('data', (data) => { console.error(`Error: ${data}`); });
                                    pythonProcess.on('close', (code) => { 
                                        console.log(`Python process exited with code ${code}`); 
                                        if (fs.existsSync(tempFilePath)) {
                                            fs.unlinkSync(tempFilePath); 
                                        }
                                    });
                                } catch (error) {
                                    console.error(`Error writing file: ${error}`);
                                }
                            };
                            reader.readAsDataURL(blob);
                        }).catch(error => console.error(`Error: ${error}`));
                }
                j++;
            }
            document.getElementById('finalDownloadButton').disabled = false;
        });
    } else {
        document.getElementById('downloadModalText').innerText = "The URL is neither a video or a playlist."
        document.getElementById('finalDownloadButton').disabled = false;
    }    
}

function updateThumbnailImage(event, salata = 0) {
    const file = event.target.files[0];
    if (file && file.type === 'image/jpeg') {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (salata == 1) {
                document.getElementById('customiseImage').src = e.target.result;
            } else if (salata == 2) {
                document.getElementById('editPlaylistThumbnail').src = e.target.result;
            } else if (salata == 3) {
                document.getElementById('thumbnailImage').src = e.target.result;
            } else { console.log("Neither, salata is ", salata) }
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please select a valid JPG image.');
    }
}

function removeSong() {
    if (confirm('Are you sure you want to remove this song?')) {
        const musicFilePath = path.join(taratorFolder, 'musics', domates); // parantezlerin içine value ekle domates yerine
        const thumbnailFilePath = path.join(taratorFolder, 'thumbnails', domates2);

        if (fs.existsSync(musicFilePath)) { fs.unlinkSync(musicFilePath); } 
        if (fs.existsSync(thumbnailFilePath)) { fs.unlinkSync(thumbnailFilePath); } 
        closeModal();
    }
}

function deletePlaylist() {
    const playlistName = document.getElementById('editInvisibleName').value;
    const filePath = path.join(taratorFolder, 'playlists.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        let playlists;
        try {
            playlists = JSON.parse(data);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            return;
        }

        const playlistIndex = playlists.findIndex(pl => pl.name === playlistName);
        if (playlistIndex !== -1) {
            playlists.splice(playlistIndex, 1);
        } else {
            console.error('Playlist not found:', playlistName);
            return;
        }

        fs.writeFile(filePath, JSON.stringify(playlists, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing file:', writeErr);
                return;
            }
            console.log('Playlist deleted successfully');
        });
    });
    document.getElementById('my-music').click();
    document.getElementById('playlists').click();
}

function differentiateYouTubeLinks(url) {
    const videoRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/;
    const playlistRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?list=([^&]+)/;
  
    if (videoRegex.test(url.trim())) {
      return 'video';
    } else if (playlistRegex.test(url.trim())) {
      return 'playlist';
    } else {
      return 'unknown';
    }
}

function saveeeAsPlaylist(theArrayThatIWillGiveToPython) {
    if (isSaveAsPlaylistActive) {
        const jsonFilePath = path.join(taratorFolder, 'playlists.json');
        fs.readFile(jsonFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the JSON file:', err);
                return;
            }

            try {
                let playlists = JSON.parse(data);

                let newPlaylist = { // TODO: Check if same named playlist exists
                    name: document.getElementById('playlistTitle0').value,
                    songs: theArrayThatIWillGiveToPython, // TODO: add .mp3 on top ya da diğerlerinden kaldır
                    thumbnail: document.getElementById('thumbnailImage0').src // TODO: Save this to local
                };

                playlists.push(newPlaylist);
                let updatedJsonData = JSON.stringify(playlists, null, 2);

                fs.writeFile(jsonFilePath, updatedJsonData, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing to the JSON file:', err);
                        return;
                    }
                    console.log('New playlist added successfully!');
                });
            } catch (parseError) {
                console.error('Error parsing the JSON data:', parseError);
            }
        });
    }
}

document.getElementById('my-music').click();
document.getElementById('main-menu').click();