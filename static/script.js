function sortResolutions(resolutions) {
    const resolutionOrder = ['4320p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];
    return resolutions.sort((b, a) => {
        return resolutionOrder.indexOf(a) - resolutionOrder.indexOf(b);
    });
}

function updateProgressBar(percent) {
    document.getElementById('progressBar').style.width = percent + '%';
}

function setButtonsDisabled(disabled) {
    document.querySelectorAll('.action-button').forEach(button => button.disabled = disabled);
}

function setActiveResolution(button) {
    document.querySelectorAll('.resolution-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}



document.getElementById('fetchResolutionsButton').onclick = function() {
    var url = document.getElementById('youtubeUrl').value;
    setButtonsDisabled(true);
    fetch('/get_resolutions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'url=' + encodeURIComponent(url)
    })
    .then(response => response.json())
    .then(resolutionsData => {
        setButtonsDisabled(false);
        if (resolutionsData.error) {
            document.getElementById('message').textContent = resolutionsData.error;
        } else {
            const sortedResolutions = sortResolutions(resolutionsData.resolutions);
            const list = document.getElementById('resolutionList');
            list.innerHTML = '';

            sortedResolutions.forEach((res, index) => {
                const button = document.createElement('button');
                button.className = 'resolution-button';
                button.textContent = res;
                button.onclick = () => setActiveResolution(button);
                list.appendChild(button);
            });
            document.getElementById('downloadButton').style.display = 'inline-block';
            document.getElementById('downloadAudioButton').style.display = 'inline-block';
            document.getElementById('videoTitle').textContent = resolutionsData.title;
            document.getElementById('videoThumbnail').src = resolutionsData.thumbnail_url;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred.';
        setButtonsDisabled(false);
    });
};

document.getElementById('downloadButton').onclick = function() {
    var url = document.getElementById('youtubeUrl').value;
    var resolution = document.querySelector('.resolution-button.active').textContent;
    document.getElementById('message').textContent = 'Processing download...';
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('progressBar').style.width = '0%';
    setButtonsDisabled(true);

    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'url=' + encodeURIComponent(url) + '&resolution=' + encodeURIComponent(resolution)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById('message').textContent = data.error;
            document.getElementById('progressContainer').style.display = 'none';
            setButtonsDisabled(false);
        } else {
            updateProgressBar(100);
            window.location.href = '/downloads/' + encodeURIComponent(data.filename);
            document.getElementById('message').textContent = 'Your download will begin shortly.';
            setButtonsDisabled(false);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred during the download.';
        document.getElementById('progressContainer').style.display = 'none';
        setButtonsDisabled(false);
    });
};

document.getElementById('downloadAudioButton').onclick = function() {
    var url = document.getElementById('youtubeUrl').value;
    document.getElementById('message').textContent = 'Processing audio download...';
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('progressBar').style.width = '0%';
    setButtonsDisabled(true);

    fetch('/download_audio', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'url=' + encodeURIComponent(url)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById('message').textContent = data.error;
            document.getElementById('progressContainer').style.display = 'none';
            setButtonsDisabled(false);
        } else {
            updateProgressBar(100);
            window.location.href = '/downloads/' + encodeURIComponent(data.filename);
            document.getElementById('message').textContent = 'Your audio download will begin shortly.';
            setButtonsDisabled(false);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred during the audio download.';
        document.getElementById('progressContainer').style.display = 'none';
        setButtonsDisabled(false);
    });
};
















//api key section
// Define the API key and API URL
const API_KEY = 'AIzaSyB8rilPFTnGyPjc9Oh7CUirGNxoM1I6gCY'; //chave restrita ao domínio!
const API_URL = 'https://www.googleapis.com/youtube/v3/search';

// Implementação básica de cache
const cache = {};
function searchYouTubeAPI() {
    var searchQuery = document.getElementById('youtubeSearchInput').value;
    if (!searchQuery.trim()) {
        alert("Please enter a search term.");
        return;
    }

    // Verificar se o usuário excedeu o limite de busca
    if (isSearchBlocked()) {
        alert("You have reached the maximum number of searches allowed. Please, search the link directly on youtube and insert it on the field 'Enter Youtube URL here'");
        return;
    }

    // Verificar cache primeiro
    const cachedData = cache[searchQuery];
    if (cachedData && (Date.now() - cachedData.timestamp) < 3600000) { // Cache válido por 1 hora
        console.log('Retrieving from cache');
        displayResults(cachedData.data);
        return;
    }

    var url = `${API_URL}?part=snippet&type=video&maxResults=100&q=${encodeURIComponent(searchQuery)}&key=${API_KEY}`;

    fetch(url)
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to fetch data from YouTube API');
        }
    })
    .then(data => {
        // Armazenar no cache
        cache[searchQuery] = {
            timestamp: Date.now(),
            data: data
        };
        displayResults(data);
        recordSearch();
    })
    .catch(error => console.error('Error:', error));
}

function recordSearch() {
    const now = Date.now();
    let searches = JSON.parse(localStorage.getItem('searches')) || [];
    searches = searches.filter(timestamp => now - timestamp < 1800000); // Mantém somente buscas dos últimos 30 minutos
    searches.push(now);
    localStorage.setItem('searches', JSON.stringify(searches));
}

function isSearchBlocked() {
    const searches = JSON.parse(localStorage.getItem('searches')) || [];
    return searches.filter(timestamp => Date.now() - timestamp < 1800000).length >= 5;
}


function displayResults(data) {
    const resultsContainer = document.getElementById('searchResultsContainer');
    resultsContainer.innerHTML = ''; // Clear previous results

    data.items.forEach(item => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumbnail = item.snippet.thumbnails.default.url;

        const videoElement = `
            <div class="video-result">
                <img src="${thumbnail}" alt="${title}">
                <p>${title}</p>
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">Watch Video</a>
            </div>
        `;
        resultsContainer.innerHTML += videoElement;
    });
}



function displayResults(data) {
    const resultsContainer = document.getElementById('searchResultsList');
    resultsContainer.innerHTML = ''; 
    resultsContainer.style.display = 'block'; 

    
    data.items.forEach((item) => {
        const videoId = item.id.videoId;
        const title = item.snippet.title;
        const thumbnail = item.snippet.thumbnails.default.url;

        const resultElement = document.createElement('div');
        resultElement.className = 'video-result';
        resultElement.innerHTML = `
            <img src="${thumbnail}" alt="${title}" class="video-thumbnail">
            <p class="video-title">${title}</p>
        `;
        resultElement.onclick = function() {
            document.getElementById('youtubeUrl').value = `https://www.youtube.com/watch?v=${videoId}`;
            resultsContainer.style.display = 'none'; 
            fetchResolutions(`https://www.youtube.com/watch?v=${videoId}`); 
        };

        resultsContainer.appendChild(resultElement);
    });
}

function fetchResolutions(url) {
    setButtonsDisabled(true);
    fetch('/get_resolutions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'url=' + encodeURIComponent(url)
    })
    .then(response => response.json())
    .then(resolutionsData => {
        setButtonsDisabled(false);
        if (resolutionsData.error) {
            document.getElementById('message').textContent = resolutionsData.error;
        } else {
            displayResolutions(resolutionsData);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred.';
        setButtonsDisabled(false);
    });
}

function displayResolutions(resolutionsData) {
    const sortedResolutions = sortResolutions(resolutionsData.resolutions);
    const list = document.getElementById('resolutionList');
    list.innerHTML = '';

    sortedResolutions.forEach((res) => {
        const button = document.createElement('button');
        button.className = 'resolution-button';
        button.textContent = res;
        button.onclick = () => setActiveResolution(button);
        list.appendChild(button);
    });

    document.getElementById('downloadButton').style.display = 'inline-block';
    document.getElementById('downloadAudioButton').style.display = 'inline-block';
    document.getElementById('videoTitle').textContent = resolutionsData.title;
    document.getElementById('videoThumbnail').src = resolutionsData.thumbnail_url;
}



