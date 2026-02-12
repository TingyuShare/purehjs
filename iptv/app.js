document.addEventListener('DOMContentLoaded', () => {
    const m3uUrlInput = document.getElementById('m3u-url');
    const loadBtn = document.getElementById('load-btn');
    const channelList = document.getElementById('channel-list');
    const videoPlayer = document.getElementById('video-player');
    const searchChannelInput = document.getElementById('search-channel-input');
    const sidebar = document.querySelector('.sidebar');

    document.addEventListener('mousemove', (e) => {
        if (e.clientX < 320) {
            sidebar.classList.remove('sidebar-hidden');
        } else {
            sidebar.classList.add('sidebar-hidden');
        }
    });

    searchChannelInput.addEventListener('input', () => {
        const searchTerm = searchChannelInput.value.toLowerCase();
        const options = channelList.getElementsByTagName('option');
        for (const option of options) {
            const channelName = option.textContent.toLowerCase();
            if (channelName.includes(searchTerm)) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        }
    });

    const savedUrl = localStorage.getItem('m3uUrl');
    if (savedUrl) {
        m3uUrlInput.value = savedUrl;
        loadChannels(savedUrl);
    }

    loadBtn.addEventListener('click', () => {
        const m3uUrl = m3uUrlInput.value.trim();
        if (m3uUrl) {
            localStorage.setItem('m3uUrl', m3uUrl);
            loadChannels(m3uUrl);
        } else {
            alert('Please enter an M3U URL.');
        }
    });

    let hls = null;

    channelList.addEventListener('change', () => {
        const selectedUrl = channelList.value;
        if (!selectedUrl) return;

        if (hls) {
            hls.destroy();
        }

        if (selectedUrl.endsWith('.m3u8')) {
            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(selectedUrl);
                hls.attachMedia(videoPlayer);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoPlayer.play();
                });
            } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                // For Safari and other browsers that support HLS natively
                videoPlayer.src = selectedUrl;
                videoPlayer.addEventListener('loadedmetadata', () => {
                    videoPlayer.play();
                });
            } else {
                alert('HLS is not supported in this browser.');
            }
        } else {
            // For non-HLS streams (e.g., MP4)
            videoPlayer.src = selectedUrl;
            videoPlayer.play();
        }
    });

    async function loadChannels(url) {
        try {
            // Fetching M3U playlist directly as per user feedback.
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.text();
            const channels = parseM3U(data);
            populateChannelList(channels);
        } catch (error) {
            console.error('Error loading M3U file:', error);
            alert('Failed to load M3U file. Check the URL and CORS policy.');
        }
    }

    function parseM3U(data) {
        const lines = data.split('\n');
        const channels = [];
        let currentChannel = {};

        for (const line of lines) {
            if (line.startsWith('#EXTINF:')) {
                const info = line.substring(line.indexOf(':') + 1);
                const [attributes, name] = info.split(',');
                currentChannel = { name: name.trim(), url: '' };
            } else if (line.trim() && !line.startsWith('#')) {
                if (currentChannel.name) {
                    currentChannel.url = line.trim();
                    channels.push(currentChannel);
                    currentChannel = {};
                }
            }
        }
        return channels;
    }

    function populateChannelList(channels) {
        channelList.innerHTML = '<option value="">Select a channel</option>';

        channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.url;
            // Set initial text with a "checking" indicator
            option.textContent = `${channel.name} (...)`;
            channelList.appendChild(option);

            // Asynchronously update the status
            checkChannelStatus(option, channel.name, channel.url);
        });
    }

    async function checkChannelStatus(optionElement, channelName, url) {
        let statusIcon = '';
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                statusIcon = '✓'; // OK (200-299)
            } else {
                statusIcon = '✗'; // Server responded with an error (404, 500, etc.)
            }
        } catch (error) {
            if (error instanceof TypeError) {
                // This is often a CORS error. The stream might be playable, but we can't check it.
                statusIcon = '?';
            } else {
                // This is likely a network error (server down, DNS issue, etc.)
                statusIcon = '✗';
            }
        }
        optionElement.textContent = `${channelName} ${statusIcon}`;
    }
});