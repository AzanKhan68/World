document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const promptInput = document.getElementById('promptInput');
    const imageResults = document.getElementById('imageResults');
    const popup = document.getElementById('popup');
    const closePopupBtn = document.querySelector('.close-btn');

    generateBtn.addEventListener('click', async () => {
        const userPrompt = promptInput.value.trim();
        const aspectRatio = document.getElementById('aspectRatio').value;

        if (!userPrompt) {
            alert('Please enter a prompt.');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        imageResults.innerHTML = '<p>Generating your images... this may take a moment.</p>';
        
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userPrompt, aspectRatio: aspectRatio })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Unknown error from server.');
            }

            const data = await response.json();
            imageResults.innerHTML = ''; // Clear loading message

            if (data.images && data.images.length > 0) {
                data.images.forEach((base64Image, index) => {
                    const imageCard = document.createElement('div');
                    imageCard.className = 'image-card';
                    imageCard.innerHTML = `
                        <img src="${base64Image}" alt="Generated image ${index + 1}">
                        <a href="${base64Image}" download="azan-world-image-${index + 1}.png" class="download-btn">Download without watermark</a>
                    `;
                    imageResults.appendChild(imageCard);
                });
                showPopup();
            } else {
                imageResults.innerHTML = '<p style="color: orange;">No images were generated. Please try a different prompt.</p>';
            }

        } catch (error) {
            console.error('Error:', error);
            imageResults.innerHTML = `<p style="color: red;">An error occurred: ${error.message}. Please check your prompt and try again.</p>`;
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Images';
        }
    });

    closePopupBtn.addEventListener('click', () => {
        hidePopup();
    });

    window.addEventListener('click', (event) => {
        if (event.target === popup) {
            hidePopup();
        }
    });

    function showPopup() {
        popup.style.display = 'flex';
    }

    function hidePopup() {
        popup.style.display = 'none';
    }
});
