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
        .then(resolutions => {
            if (resolutions.error) {
                document.getElementById('message').textContent = resolutions.error;
            } else {
                // Ordena as resoluções
                const sortedResolutions = sortResolutions(resolutions);

                // Generate radio buttons for resolutions
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
                    // Set the first resolution as the default selected one
                    if (index === 0) radioButton.checked = true;

                    label.insertBefore(radioButton, label.firstChild);
                    listItem.appendChild(label);
                    list.appendChild(listItem);
                });
                // Show the download button
                document.getElementById('downloadButton').style.display = 'inline-block';
            }
        })
        .catch(error => console.error('Error:', error));
    };

    document.getElementById('downloadButton').onclick = function() {
        var url = document.getElementById('youtubeUrl').value;
        var resolution = document.querySelector('input[name="resolution"]:checked').value;

        // Mostrar uma mensagem de carregamento ou processamento
        document.getElementById('message').textContent = 'Processing download...';

        fetch('/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            // Inclua a resolução selecionada na solicitação
            body: 'url=' + encodeURIComponent(url) + '&resolution=' + encodeURIComponent(resolution)
        })
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                document.getElementById('message').textContent = data.error;
            } else {
                // Se o arquivo foi baixado com sucesso, inicia o download no navegador
                // Aqui você precisa fornecer a rota correta e o nome do arquivo se necessário
                window.location.href = '/downloads/' + encodeURIComponent(data.filename);
                document.getElementById('message').textContent = 'Your download will begin shortly.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('message').textContent = 'An error occurred during the download.';
        });
    };