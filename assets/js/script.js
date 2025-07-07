// --- GLOBAL VARIABLES ---
let printModal, downloadModal;
let pageData = null; 

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const printModalEl = document.getElementById('printModal');
    printModal = new bootstrap.Modal(printModalEl);
    downloadModal = new bootstrap.Modal(document.getElementById('downloadModal'));
    
    printModalEl.addEventListener('hidden.bs.modal', () => {
        document.getElementById('printButton').focus();
    });

    document.getElementById('category').addEventListener('change', (e) => {
        const presets = { 'Whole 1000g': '1000', 'Crushed 250g': '250', 'Crushed 500g': '500', 'Crushed 1000g': '1000' };
        const weight = presets[e.target.value] || '';
        document.getElementById('weightNum').value = weight;
        document.getElementById('weightType').value = weight ? 'gm' : '';
    });

    // --- NEW: LOGO CHANGER ---
    // This listener updates the main logo at the top of the page.
    document.getElementById('logoName').addEventListener('change', (e) => {
        const mainLogo = document.getElementById('mainLogo');
        if (mainLogo) {
            mainLogo.src = e.target.value;
        }
    });
});

// --- CORE LOGIC ---
const dimensions = {
    A4: { width: 8.27, height: 11.69 }, Letter: { width: 8.5, height: 11 }, '8.5x13': { width: 8.5, height: 13 },
};

function calculateMaxLabels(paperSize, orientation) {
    let r, c;
    if (orientation === 'landscape') {
        if (paperSize === '8.5x13') { r = 6; c = 4; } else { r = 5; c = 4; }
    } else {
        if (paperSize === '8.5x13') { r = 4; c = 6; } else { r = 4; c = 5; }
    }
    return { maxLabels: r * c, labelsPerRow: r, labelsPerColumn: c };
}

function generateLabelData() {
    const form = document.getElementById('labelForm');
    if (!form.checkValidity()) { form.reportValidity(); return null; }
    const data = {
        // MODIFIED: Get the selected logo source
        logoSrc: form.logoName.value,
        paperSize: form.paperSize.value, 
        orientation: form.orientation.value,
        weightText: form.category.value.includes('g') ? form.category.value : `${form.category.value.replace(' (Custom)', '')} ${form.weightNum.value}${form.weightType.value}`
    };
    if (!form.pdInput.value) { Swal.fire('Missing Date', 'Please select a Production Date.', 'error'); return null; }
    const prodDate = new Date(form.pdInput.value);
    const bestDate = new Date(prodDate);
    bestDate.setDate(prodDate.getDate() + 30);
    const dateOptions = { year: 'numeric', month: 'long', day: '2-digit' };
    data.formattedPD = prodDate.toLocaleDateString('en-US', dateOptions);
    data.formattedBB = bestDate.toLocaleDateString('en-US', dateOptions);
    Object.assign(data, calculateMaxLabels(data.paperSize, data.orientation));
    return data;
}

// --- ACTION: PRINT ---
function printLabels() {
    pageData = generateLabelData();
    if (!pageData) return;
    printModal.show();
}

function triggerPrint() {
    printModal.hide();
    // MODIFIED: Destructure logoSrc from pageData
    const { paperSize, orientation, maxLabels, labelsPerRow, weightText, formattedPD, formattedBB, logoSrc } = pageData;
    
    // MODIFIED: Use dynamic logoSrc and add onerror fallback
    const labelHtml = `<div class="label-card"><div><img src="${logoSrc}" class="logo" onerror="this.outerHTML='<div class=\\'logo-fallback\\'>No Image</div>'"><p>${weightText}</p></div><div class="dates"><p><strong>PD:</strong> ${formattedPD}</p><p><strong>BB:</strong> ${formattedBB}</p></div></div>`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Labels</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet" />
                <style>
                    @page {
                        size: ${paperSize === '8.5x13' ? '8.5in 13in' : paperSize} ${orientation};
                        margin: 0.25in;
                    }
                    body { margin: 0; font-family: 'Poppins', sans-serif; }
                    .print-container { display: grid; gap: 0; grid-template-columns: repeat(${labelsPerRow}, 2in); justify-content: center; }
                    .label-card { border: 0.75pt dashed lightgray; text-align: center; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 2in; height: 2in; box-sizing: border-box; padding: 6px; page-break-inside: avoid; }
                    .label-card img.logo { max-width: 60%; height: auto; margin-bottom: 4px; }
                    .label-card p { margin: 2px 0; font-size: 10px; font-weight: 700; }
                    .dates { width: 60%; margin-top: 4px; }
                    .dates p { font-size: 9px; text-align: left; border-bottom: 0.5pt solid #555; padding-bottom: 2px; margin-bottom: 5px; }
                    .logo-fallback { border: 1px solid #ccc; border-radius: 8px; width: 60%; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #888; margin-bottom: 4px; }
                </style>
            </head>
            <body>
                <div class="print-container">${Array(maxLabels).fill(labelHtml).join('')}</div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// --- ACTION: EXPORT PDF ---
function exportPdfLabels() {
    const data = generateLabelData();
    if (!data) return;
    const pageWrapper = document.createElement('div');
    pageWrapper.id = 'pdf-page-wrapper'; pageWrapper.className = 'pdf-page-wrapper';
    let { width, height } = dimensions[data.paperSize];
    if (data.orientation === 'landscape') [width, height] = [height, width];
    pageWrapper.style.width = `${width}in`; pageWrapper.style.height = `${height}in`;
    
    // MODIFIED: Use dynamic logoSrc and add onerror fallback
    const labelHtml = `<div class="label-card"><div><img src="${data.logoSrc}" class="logo" onerror="this.outerHTML='<div class=\\'logo-fallback\\'>No Image</div>'"><p>${data.weightText}</p></div><div class="dates"><p><strong>PD:</strong> ${data.formattedPD}</p><p><strong>BB:</strong> ${data.formattedBB}</p></div></div>`;
    
    const labelContainer = document.createElement('div');
    labelContainer.className = 'label-container'; labelContainer.style.gridTemplateColumns = `repeat(${data.labelsPerRow}, 2in)`;
    labelContainer.innerHTML = Array(data.maxLabels).fill(labelHtml).join('');
    pageWrapper.appendChild(labelContainer); document.body.appendChild(pageWrapper);
    const pdfFormat = data.paperSize === '8.5x13' ? [8.5, 13] : data.paperSize.toLowerCase();
    const opt = { margin: 0, filename: 'labels.pdf', image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 2, dpi: 300, useCORS: true }, jsPDF: { unit: 'in', format: pdfFormat, orientation: data.orientation } };
    html2pdf().set(opt).from(pageWrapper).save().then(() => {
        document.getElementById('pdf-page-wrapper')?.remove();
        Swal.fire('Exported!', 'Labels have been exported as PDF.', 'success');
    });
}

// --- ACTION: DOWNLOAD IMAGE ---
function downloadLabel() {
    const data = generateLabelData();
    if (!data) return;
    
    // MODIFIED: Use dynamic logoSrc and add onerror fallback
    const singleLabelHtml = `<div class="label-card" style="margin:0; background-color: #ffffff;"><div><img src="${data.logoSrc}" class="logo" onerror="this.outerHTML='<div class=\\'logo-fallback\\'>No Image</div>'"><p>${data.weightText}</p></div><div class="dates"><p><strong>PD:</strong> ${data.formattedPD}</p><p><strong>BB:</strong> ${data.formattedBB}</p></div></div>`;
    
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed'; tempContainer.style.left = '-9999px';
    tempContainer.innerHTML = singleLabelHtml;
    document.body.appendChild(tempContainer);
    const labelToRender = tempContainer.firstChild;
    const imageToLoad = labelToRender.querySelector('img');

    const renderCanvas = () => {
        html2canvas(labelToRender, { scale: 4, dpi: 300, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
            document.body.removeChild(tempContainer);
            const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
            const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobile) {
                document.getElementById('download-image-preview').src = dataUrl;
                downloadModal.show();
            } else {
                const link = document.createElement('a'); link.download = 'label.jpg'; link.href = dataUrl; link.click();
                Swal.fire('Downloaded!', 'Label has been downloaded as JPEG.', 'success');
            }
        });
    };

    // Check if an image exists to be loaded. If not (fallback was used), render directly.
    if (imageToLoad && !imageToLoad.complete) {
        imageToLoad.onload = renderCanvas;
        imageToLoad.onerror = renderCanvas; // Also render if the image fails to load
    } else {
        renderCanvas(); // Render immediately if there's no image or it's already cached
    }
}