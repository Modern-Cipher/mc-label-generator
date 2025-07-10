// assets/js/mobile-handler.js

(function() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) {
        return;
    }

    // --- SELF-CONTAINED HELPER FUNCTIONS ---
    function createLabelHtml(data) {
        return `<div class="label-card">
                <div class="logo-wrapper">
                    <img src="${data.logoSrc}" class="logo" alt="Label Logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="logo-fallback" style="display:none;">No Image</div>
                </div>
                <p class="main-content">${data.primaryText}</p>
                <div class="dates"><p><strong>PD:</strong> ${data.formattedPD}</p><p><strong>BB:</strong> ${data.formattedBB}</p></div>
            </div>`;
    }

    function generateDynamicFilename() {
        const logoSelectElement = document.getElementById('logoName');
        const selectedOptionText = logoSelectElement.options[logoSelectElement.selectedIndex].text;
        const logoName = selectedOptionText.trim().replace(/\s+/g, '-');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomChars = '';
        for (let i = 0; i < 3; i++) { randomChars += chars.charAt(Math.floor(Math.random() * chars.length)); }
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
     * FINAL MOBILE CONTENT GENERATOR
     * This uses a fixed-size grid and CSS transform:scale() to ensure perfect fitting.
     */
    function generateFinalMobileContent(data) {
        const { paperSize, orientation, maxLabels, labelsPerRow, labelsPerColumn, cssPath } = data;
        const labelCardHtml = createLabelHtml(data);
        const filename = generateDynamicFilename();

        // --- Start: Scaling Calculation ---
        const PAGE_MARGIN_INCHES = 0.2; // A safe margin
        const paperDimensions = {
            'Letter': [8.5, 11], 'A4': [8.27, 11.69], '8.5x13': [8.5, 13]
        };

        let [pageWidth, pageHeight] = paperDimensions[paperSize];
        if (orientation === 'landscape') {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
        }

        const availableWidth = pageWidth - (PAGE_MARGIN_INCHES * 2);
        const availableHeight = pageHeight - (PAGE_MARGIN_INCHES * 2);

        const contentWidth = labelsPerRow * 2; // 2 inches per label
        const contentHeight = labelsPerColumn * 2; // 2 inches per label

        const scaleX = availableWidth / contentWidth;
        const scaleY = availableHeight / contentHeight;
        const scaleFactor = Math.min(scaleX, scaleY); // Use the smaller scale factor to fit both ways
        // --- End: Scaling Calculation ---

        const styles = `
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page {
                size: ${paperSize === '8.5x13' ? '8.5in 13in' : paperSize} ${orientation};
                margin: ${PAGE_MARGIN_INCHES}in;
            }
            html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
            body { 
                font-family: 'Poppins', sans-serif;
                /* Center the scaled content block on the page */
                display: flex;
                align-items: flex-start;
                justify-content: flex-start;
            }
            .print-container {
                display: grid;
                /* The grid is a fixed size, based on 2x2 inch labels */
                grid-template-columns: repeat(${labelsPerRow}, 2in);
                grid-template-rows: repeat(${labelsPerColumn}, 2in);
                gap: 0;
                /* THE MAGIC: Scale the whole fixed-size block down to fit the page */
                transform: scale(${scaleFactor});
                transform-origin: top left;
            }
            .label-card {
                width: 2in;
                height: 2in;
                overflow: hidden;
                border: 1px dashed #666;
                box-sizing: border-box;
                /* FORCED NO GAP: Negative margin to collapse borders */
                margin: -0.5px; 
            }
        `;
        const absoluteCssPath = `./${cssPath}`; // Relative path for GitHub
        return `<!DOCTYPE html><html><head><title>${filename}</title>
            <link rel="stylesheet" type="text/css" href="${absoluteCssPath}" /><style>${styles}</style>
            </head><body><div class="print-container">${Array(maxLabels).fill(labelCardHtml).join('')}</div></body></html>`;
    }

    // --- OVERRIDING DESKTOP FUNCTIONS FOR MOBILE ---

    window.triggerPrint = function() {
        const printModalEl = document.getElementById('printModal');
        const printModal = bootstrap.Modal.getInstance(printModalEl);
        if (printModal) { printModal.hide(); }
        
        const printContent = generateFinalMobileContent(pageData);
        
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed'; iframe.style.visibility = 'hidden';
        iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
        document.body.appendChild(iframe);
        iframe.srcdoc = printContent;
        iframe.onload = function() {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) { Swal.fire('Printing Error', 'Could not open print dialog.', 'error'); }
            finally { setTimeout(() => document.body.removeChild(iframe), 2000); }
        };
    };

    window.exportPdfLabels = function() {
        const data = generateLabelData();
        if (!data) return;

        const contentToRender = generateFinalMobileContent(data);
        const filename = generateDynamicFilename();
        const pdfFormat = data.paperSize === '8.5x13' ? [8.5, 13] : data.paperSize.toLowerCase();
        
        const opt = {
            margin: 0, // Margin is handled by @page now
            filename: `${filename}.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { scale: 3, dpi: 300, useCORS: true, letterRendering: true, logging: false },
            jsPDF: { unit: 'in', format: pdfFormat, orientation: data.orientation }
        };
        html2pdf().from(contentToRender).set(opt).save().catch(err => console.error(err));
    };

    window.downloadLabel = function() {
        const data = generateLabelData();
        if (!data) return;
        const singleLabelHtml = createLabelHtml(data);
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed'; tempContainer.style.left = '-9999px';
        tempContainer.style.width = '2in'; tempContainer.style.height = '2in';
        tempContainer.innerHTML = singleLabelHtml;
        document.body.appendChild(tempContainer);
        const labelToRender = tempContainer.querySelector('.label-card');
        const renderOptions = {
            scale: 4, dpi: 300, useCORS: true, backgroundColor: '#ffffff',
            onclone: (doc) => {
                const link = doc.createElement('link');
                link.rel = 'stylesheet'; link.href = `./${data.cssPath}`; // Relative path for GitHub
                doc.head.appendChild(link);
            }
        };
        setTimeout(() => {
            html2canvas(labelToRender, renderOptions).then(canvas => {
                document.body.removeChild(tempContainer);
                const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
                const filename = generateDynamicFilename();
                const imagePreview = document.getElementById('download-image-preview');
                const modalBody = imagePreview.parentElement;
                let downloadBtn = document.getElementById('download-link-button');
                if (!downloadBtn) {
                    const p = modalBody.querySelector('p');
                    if (p) { p.textContent = 'Long-press the image below, or use the button to save.'; }
                    downloadBtn = document.createElement('a');
                    downloadBtn.id = 'download-link-button';
                    downloadBtn.className = 'btn btn-primary mt-3 w-100';
                    downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download Image';
                    modalBody.appendChild(downloadBtn);
                }
                imagePreview.src = dataUrl;
                downloadBtn.href = dataUrl;
                downloadBtn.download = `${filename}.jpg`;
                const downloadModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('downloadModal'));
                downloadModal.show();
            }).catch(err => {
                document.body.removeChild(tempContainer);
                Swal.fire('Error', 'Could not generate the image.', 'error');
            });
        }, 250);
    };
})();