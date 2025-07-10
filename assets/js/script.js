// assets/js/script.js

// --- GLOBAL VARIABLES ---
let pageData = null;
let currentLabelCssLink = null;

// --- IMAGE PRELOADER ---
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = 'anonymous'; // Enable CORS
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // --- UI ACTIONS INITIALIZATION ---
    const infoButton = document.getElementById('infoButton');
    if (infoButton) {
        infoButton.addEventListener('click', () => {
            const infoModalEl = document.getElementById('systemInfoModal');
            const infoModal = bootstrap.Modal.getOrCreateInstance(infoModalEl);
            infoModal.show();
        });
    }

    // --- MAIN FORM LOGIC ---
    const categorySelect = document.getElementById('category');
    const weightNumInput = document.getElementById('weightNum');
    const weightTypeSelect = document.getElementById('weightType');

    categorySelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        const weightMatch = selectedValue.match(/(\d+)gm$/);

        if (weightMatch) {
            const weight = weightMatch[1];
            weightNumInput.value = weight;
            weightTypeSelect.value = 'gm';
            weightNumInput.disabled = true;
            weightTypeSelect.disabled = true;
        } else if (selectedValue.includes('(Custom)')) {
            weightNumInput.value = '';
            weightTypeSelect.value = '';
            weightNumInput.disabled = false;
            weightTypeSelect.disabled = false;
        }
    });

    const logoNameSelect = document.getElementById('logoName');
    const mainLogo = document.getElementById('mainLogo');

    const loadLabelCss = (logoPath) => {
        if (currentLabelCssLink) {
            currentLabelCssLink.remove();
        }
        const cssFileName = logoPath.split('/').pop().replace('.png', '.css');
        const cssFilePath = `./assets/css/${cssFileName}`; // Relative path

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

    if (logoNameSelect.value) {
        loadLabelCss(logoNameSelect.value);
    }
});

// --- CORE LOGIC (SHARED BETWEEN DESKTOP AND MOBILE) ---
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
    const primaryText = categoryValue.includes('(Custom)') 
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
    data.cssPath = `./assets/css/${data.logoSrc.split('/').pop().replace('.png', '.css')}`; // Relative path
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

/**
 * Generates the HTML content specifically for the PRINT DIALOG.
 * Preloads images to ensure they appear in the output.
 */
async function generatePrintContent(data) {
    const { paperSize, orientation, maxLabels, labelsPerRow, labelsPerColumn, cssPath, logoSrc } = data;
    const labelCardHtml = createLabelHtml(data);
    const filename = generateDynamicFilename();

    try {
        // Preload the logo image
        await preloadImage(logoSrc);

        const styles = `
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page {
                size: ${paperSize === '8.5x13' ? '8.5in 13in' : paperSize} ${orientation};
                margin: 0.2in; /* Safe margin for most printers */
            }
            html, body { margin: 0; padding: 0; }
            body { font-family: 'Poppins', sans-serif; }
            .print-container {
                display: grid;
                grid-template-columns: repeat(${labelsPerRow}, 2in);
                grid-template-rows: repeat(${labelsPerColumn}, 2in);
                gap: 0;
            }
            .label-card {
                width: 2in;
                height: 2in;
                overflow: hidden;
                border: 1px dashed #666; 
                box-sizing: border-box;
            }
            .label-card img {
                max-width: 100%;
                height: auto;
            }
        `;
        const absoluteCssPath = `./${cssPath}`; // Relative path
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${filename}</title>
                    <link rel="stylesheet" type="text/css" href="${absoluteCssPath}" />
                    <style>${styles}</style>
                </head>
                <body>
                    <div class="print-container">${Array(maxLabels).fill(labelCardHtml).join('')}</div>
                </body>
            </html>`;
    } catch (err) {
        Swal.fire('Error', 'Failed to load logo image. Please check your internet connection or image path.', 'error');
        console.error('Image preload error:', err);
        return null;
    }
}

// --- ACTION: PRINT LABELS ---
async function printLabels() {
    pageData = generateLabelData();
    if (!pageData) return;
    
    const printModalEl = document.getElementById('printModal');
    const printModal = bootstrap.Modal.getOrCreateInstance(printModalEl);
    printModal.show();
}

/**
 * DEFAULT (DESKTOP) PRINT FUNCTION
 */
async function triggerPrint() {
    const printModalEl = document.getElementById('printModal');
    const printModal = bootstrap.Modal.getInstance(printModalEl);
    if (printModal) {
        printModal.hide();
    }

    const printContent = await generatePrintContent(pageData);
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.write('<script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 250); };<\/script>');
    printWindow.document.close();
}

// --- ACTION: EXPORT PDF ---
async function exportPdfLabels() {
    const data = generateLabelData();
    if (!data) return;

    try {
        // Preload the logo image
        await preloadImage(data.logoSrc);

        // Create a container element for PDF rendering
        const contentToRender = document.createElement('div');
        contentToRender.style.width = `${data.labelsPerRow * 2}in`;
        contentToRender.style.height = `${data.labelsPerColumn * 2}in`;
        contentToRender.style.display = 'grid';
        contentToRender.style.gridTemplateColumns = `repeat(${data.labelsPerRow}, 2in)`;
        contentToRender.style.gridTemplateRows = `repeat(${data.labelsPerColumn}, 2in)`;
        contentToRender.style.gap = '0';

        const labelHtml = createLabelHtml(data);
        contentToRender.innerHTML = Array(data.maxLabels).fill(labelHtml).join('');

        const labels = contentToRender.querySelectorAll('.label-card');
        labels.forEach(label => {
            label.style.border = '1px dashed #666';
            label.style.boxSizing = 'border-box';
            label.style.overflow = 'hidden';
        });

        const filename = generateDynamicFilename();
        const pdfFormat = data.paperSize === '8.5x13' ? [8.5, 13] : data.paperSize.toLowerCase();

        const opt = {
            margin: 0.15, // Small margin for content fit
            filename: `${filename}.pdf`,
            image: { type: 'jpeg', quality: 0.98 }, // Slightly lower quality for speed
            html2canvas: { scale: 2, dpi: 300, useCORS: true, letterRendering: true }, // Lower scale for speed
            jsPDF: { unit: 'in', format: pdfFormat, orientation: data.orientation }
        };

        // Load brand-specific CSS
        const brandCssLink = document.createElement('link');
        brandCssLink.rel = 'stylesheet';
        brandCssLink.href = `./${data.cssPath}`; // Relative path
        document.head.appendChild(brandCssLink);

        await html2pdf()
            .from(contentToRender)
            .set(opt)
            .save();
        
        Swal.fire('Exported!', 'Labels have been exported as PDF.', 'success');
        document.head.removeChild(brandCssLink); // Clean up
    } catch (err) {
        Swal.fire('Export Error', 'Could not generate PDF. Please check image availability or try again.', 'error');
        console.error("PDF Export Error:", err);
    }
}

/**
 * DEFAULT (DESKTOP) DOWNLOAD FUNCTION
 */
async function downloadLabel() {
    const data = generateLabelData();
    if (!data) return;

    try {
        // Preload the logo image
        await preloadImage(data.logoSrc);

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
            scale: 2, // Lower scale for speed
            dpi: 300,
            useCORS: true,
            backgroundColor: '#ffffff',
            onclone: (clonedDocument) => {
                const brandCssLink = clonedDocument.createElement('link');
                brandCssLink.rel = 'stylesheet';
                brandCssLink.href = `./${data.cssPath}`; // Relative path
                clonedDocument.head.appendChild(brandCssLink);
            }
        };

        const canvas = await html2canvas(labelToRender, renderOptions);
        document.body.removeChild(tempContainer);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.98); // Slightly lower quality for speed

        const link = document.createElement('a');
        link.download = `${filename}.jpg`;
        link.href = dataUrl;
        link.click();
        Swal.fire('Downloaded!', 'Label has been downloaded as JPEG.', 'success');
    } catch (err) {
        document.body.removeChild(tempContainer);
        Swal.fire('Error', 'Could not generate the image.', 'error');
        console.error('html2canvas error:', err);
    }
}