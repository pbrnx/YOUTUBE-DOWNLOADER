// Função para ordenar resoluções de forma decrescente
function sortResolutions(resolutions) {
    const resolutionOrder = ['4320p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];
    return resolutions.sort((a, b) => {
        return resolutionOrder.indexOf(b) - resolutionOrder.indexOf(a);
    });
}

// Função para atualizar a barra de progresso
function updateProgressBar(percent) {
    document.getElementById('progressBar').style.width = percent + '%';
}

// Função para desabilitar ou habilitar os botões
function setButtonsDisabled(disabled) {
    document.querySelectorAll('.action-button').forEach(button => button.disabled = disabled);
}

// Função para definir a resolução ativa
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
        if(data.error) {
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
