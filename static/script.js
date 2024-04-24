// Função para ordenar resoluções de forma decrescente
function sortResolutions(resolutions) {
    const resolutionOrder = ['4320p', '2160p','1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];
    return resolutions.sort((a, b) => {
        return resolutionOrder.indexOf(b) - resolutionOrder.indexOf(a);
    });
}

document.getElementById('fetchResolutionsButton').onclick = function() {
    var url = document.getElementById('youtubeUrl').value;
    fetch('/get_resolutions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'url=' + encodeURIComponent(url)
    })
    .then(response => response.json())
    .then(resolutionsData => {
        if (resolutionsData.error) {
            document.getElementById('message').textContent = resolutionsData.error;
        } else {
            const sortedResolutions = sortResolutions(resolutionsData.resolutions);
            const list = document.getElementById('resolutionList');
            list.innerHTML = ''; // Clear previous

            sortedResolutions.forEach((res, index) => {
                const listItem = document.createElement('li');

                const label = document.createElement('label');
                label.textContent = res;

                const radioButton = document.createElement('input');
                radioButton.type = 'radio';
                radioButton.name = 'resolution';
                radioButton.value = res;
                radioButton.id = 'res'+index;
                if (index === 0) radioButton.checked = true;

                label.insertBefore(radioButton, label.firstChild);
                listItem.appendChild(label);
                list.appendChild(listItem);
            });
            document.getElementById('downloadButton').style.display = 'inline-block';
            
            // Atualize o título e a thumbnail
            document.getElementById('videoTitle').textContent = resolutionsData.title;
            document.getElementById('videoThumbnail').src = resolutionsData.thumbnail_url;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred.';
    });
};

document.getElementById('downloadButton').onclick = function() {
    var url = document.getElementById('youtubeUrl').value;
    var resolution = document.querySelector('input[name="resolution"]:checked').value;

    document.getElementById('message').textContent = 'Processing download...';

    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'url=' + encodeURIComponent(url) + '&resolution=' + encodeURIComponent(resolution)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) {
            document.getElementById('message').textContent = data.error;
        } else {
            // Se o arquivo foi baixado com sucesso, inicia o download no navegador
            window.location.href = '/downloads/' + encodeURIComponent(data.filename);
            document.getElementById('message').textContent = 'Your download will begin shortly.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred during the download.';
    });
};




document.getElementById('downloadButton').onclick = function() {
    var url = document.getElementById('youtubeUrl').value;
    var resolution = document.querySelector('input[name="resolution"]:checked').value;

    document.getElementById('message').textContent = 'Processing download...';
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('progressBar').style.width = '0%'; // Reset the progress bar

    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'url=' + encodeURIComponent(url) + '&resolution=' + encodeURIComponent(resolution)
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) {
            document.getElementById('message').textContent = data.error;
            document.getElementById('progressContainer').style.display = 'none';
        } else {
            updateProgressBar(100);  // Simulate full progress
            window.location.href = '/downloads/' + encodeURIComponent(data.filename);
            document.getElementById('message').textContent = 'Your download will begin shortly.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'An error occurred during the download.';
        document.getElementById('progressContainer').style.display = 'none';
    });
};

function updateProgressBar(percent) {
    document.getElementById('progressBar').style.width = percent + '%';
}

// Example to simulate incremental progress
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 100) {
            progress += 10;
            updateProgressBar(progress);
        } else {
            clearInterval(interval);
        }
    }, 1000);
}
