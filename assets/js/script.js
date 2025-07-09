// assets/js/script.js

// --- GLOBAL VARIABLES ---
let printModal, downloadModal;
let pageData = null;
let currentLabelCssLink = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Modals
    printModal = new bootstrap.Modal(document.getElementById('printModal'));
    downloadModal = new bootstrap.Modal(document.getElementById('downloadModal'));

    document.getElementById('printModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('printButton').focus();
    });

    // Event listener for category change to auto-fill weight
    document.getElementById('category').addEventListener('change', (e) => {
        const presets = { 'Whole 1000g': '1000', 'Crushed 250g': '250', 'Crushed 500g': '500', 'Crushed 1000g': '1000' };
        const weight = presets[e.target.value] || '';
        document.getElementById('weightNum').value = weight;
        document.getElementById('weightType').value = weight ? 'gm' : '';
    });

    // --- DYNAMIC LOGO CHANGER & CSS LOADER ---
    const logoNameSelect = document.getElementById('logoName');
    const mainLogo = document.getElementById('mainLogo');

    const loadLabelCss = (logoPath) => {
        if (currentLabelCssLink) {
            currentLabelCssLink.remove();
        }
        const cssFileName = logoPath.split('/').pop().replace('.png', '.css');
        const cssFilePath = `assets/css/${cssFileName}`;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssFilePath;
        link.id = 'dynamic-label-css';
        document.head.appendChild(link);
        currentLabelCssLink = link;
    };

    logoNameSelect.addEventListener('change', (e) => {
        const newLogoPath = e.target.value;
        if (mainLogo) {
            mainLogo.src = newLogoPath;
        }
        loadLabelCss(newLogoPath);
    });

    // Initial load
    if (logoNameSelect.value) {
        loadLabelCss(logoNameSelect.value);
    }
});

// --- CORE LOGIC ---

function calculateMaxLabels(paperSize, orientation) {
    let r, c;
    const isFolio = paperSize === '8.5x13';
    if (orientation === 'landscape') {
        c = isFolio ? 6 : 5;
        r = 4;
    } else {
        c = 4;
        r = isFolio ? 6 : 5;
    }
    return { maxLabels: r * c, labelsPerRow: c, labelsPerColumn: r };
}

function generateLabelData() {
    const form = document.getElementById('labelForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return null;
    }
    if (!form.pdInput.value) {
        Swal.fire('Missing Date', 'Please select a Production Date.', 'error');
        return null;
    }

    const categoryValue = form.category.value;
    const primaryText = categoryValue.includes('Custom') 
        ? `${categoryValue.replace(' (Custom)', '')} ${form.weightNum.value}${form.weightType.value}`
        : categoryValue;

    const prodDate = new Date(form.pdInput.value);
    const bestDate = new Date(prodDate);
    bestDate.setDate(prodDate.getDate() + 30);
    const dateOptions = { year: 'numeric', month: 'long', day: '2-digit' };

    const data = {
        logoSrc: form.logoName.value,
        paperSize: form.paperSize.value,
        orientation: form.orientation.value,
        primaryText: primaryText,
        formattedPD: prodDate.toLocaleDateString('en-US', dateOptions),
        formattedBB: bestDate.toLocaleDateString('en-US', dateOptions),
    };
    
    Object.assign(data, calculateMaxLabels(data.paperSize, data.orientation));
    data.cssPath = `assets/css/${data.logoSrc.split('/').pop().replace('.png', '.css')}`;
    return data;
}

function createLabelHtml(data) {
    return `
        <div class="label-card">
            <div class="logo-wrapper">
                <img src="${data.logoSrc}" class="logo" alt="Label Logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="logo-fallback" style="display:none;">No Image</div>
            </div>
            <p class="main-content">${data.primaryText}</p>
            <div class="dates">
                <p><strong>PD:</strong> ${data.formattedPD}</p>
                <p><strong>BB:</strong> ${data.formattedBB}</p>
            </div>
        </div>
    `;
}

function generateDynamicFilename() {
  const logoSelectElement = document.getElementById('logoName');
  const selectedOptionText = logoSelectElement.options[logoSelectElement.selectedIndex].text;
  const logoName = selectedOptionText.trim().replace(/\s+/g, '-');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomChars = '';
  for (let i = 0; i < 3; i++) {
    randomChars += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours);
  const timestamp = `${month}${day}${year}-${formattedHours}${minutes}${ampm}`;
  return `${logoName}-${randomChars}-${timestamp}`;
}

// --- ACTION: PRINT LABELS ---
function printLabels() {
    pageData = generateLabelData();
    if (!pageData) return;
    printModal.show();
}

// --- !! INAYOS NA FUNCTION PARA SA MOBILE PRINTING !! ---
function triggerPrint() {
    printModal.hide();
    const { paperSize, orientation, maxLabels, labelsPerRow, labelsPerColumn, cssPath } = pageData;
    const labelCardHtml = createLabelHtml(pageData);
    const filename = generateDynamicFilename();
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const printContent = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>${filename}</title>
                <link rel="stylesheet" type="text/css" href="${cssPath}" />
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page {
                        size: ${paperSize === '8.5x13' ? '8.5in 13in' : paperSize} ${orientation};
                        margin: 0.1in;
                    }
                    body { font-family: 'Poppins', sans-serif; margin: 0; }
                    .print-container {
                        display: grid;
                        grid-template-columns: repeat(${labelsPerRow}, 2in);
                        grid-template-rows: repeat(${labelsPerColumn}, 2in);
                        gap: 0;
                        width: ${labelsPerRow * 2}in;
                        height: ${labelsPerColumn * 2}in;
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    ${Array(maxLabels).fill(labelCardHtml).join('')}
                </div>
            </body>
        </html>
    `;

    // MOBILE-FRIENDLY PRINTING (uses hidden iframe)
    if (isMobile) {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(printContent);
        iframeDoc.close();

        iframe.onload = function() {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                Swal.fire('Printing Error', 'Could not open print dialog.', 'error');
                console.error("Print failed for mobile:", e);
            } finally {
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }
        };
    } else {
        // DESKTOP PRINTING (original method)
        const printWindow = window.open('', '_blank');
        const printDoc = printWindow.document;
        printDoc.open();
        printDoc.write(printContent);
        printDoc.write('<script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 250); }<\/script>');
        printDoc.close();
    }
}


// --- ACTION: EXPORT PDF ---
function exportPdfLabels() {
    const data = generateLabelData();
    if (!data) return;

    const { paperSize, orientation, maxLabels, labelsPerRow, labelsPerColumn } = data;
    const labelCardHtml = createLabelHtml(data);
    const filename = generateDynamicFilename();
    
    const contentToRender = document.createElement('div');
    contentToRender.style.width = `${labelsPerRow * 2}in`;
    contentToRender.style.height = `${labelsPerColumn * 2}in`;
    contentToRender.style.display = 'grid';
    contentToRender.style.gridTemplateColumns = `repeat(${labelsPerRow}, 2in)`;
    contentToRender.style.gridTemplateRows = `repeat(${labelsPerColumn}, 2in)`;
    contentToRender.innerHTML = Array(maxLabels).fill(labelCardHtml).join('');

    const pdfFormat = data.paperSize === '8.5x13' ? [8.5, 13] : data.paperSize.toLowerCase();
    const opt = {
        margin: 0.1,
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 3, dpi: 300, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: pdfFormat, orientation: data.orientation }
    };

    html2pdf().set(opt).from(contentToRender).save().then(() => {
        Swal.fire('Exported!', 'Labels have been exported as PDF.', 'success');
    });
}


// --- ACTION: DOWNLOAD IMAGE ---
function downloadLabel() {
    const data = generateLabelData();
    if (!data) return;

    const singleLabelHtml = createLabelHtml(data);
    const filename = generateDynamicFilename();
    
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '2in';
    tempContainer.style.height = '2in';
    tempContainer.innerHTML = singleLabelHtml;
    document.body.appendChild(tempContainer);
    
    const labelToRender = tempContainer.querySelector('.label-card');

    const renderOptions = {
        scale: 4,
        dpi: 300,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDocument) => {
            const brandCssLink = clonedDocument.createElement('link');
            brandCssLink.rel = 'stylesheet';
            brandCssLink.href = data.cssPath;
            clonedDocument.head.appendChild(brandCssLink);
        }
    };
    
    setTimeout(() => {
        html2canvas(labelToRender, renderOptions).then(canvas => {
            document.body.removeChild(tempContainer);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
            const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isMobile) {
                document.getElementById('download-image-preview').src = dataUrl;
                downloadModal.show();
            } else {
                const link = document.createElement('a');
                link.download = `${filename}.jpg`;
                link.href = dataUrl;
                link.click();
                Swal.fire('Downloaded!', 'Label has been downloaded as JPEG.', 'success');
            }
        }).catch(err => {
            document.body.removeChild(tempContainer);
            Swal.fire('Error', 'Could not generate the image.', 'error');
            console.error('html2canvas error:', err);
        });
    }, 250);
}