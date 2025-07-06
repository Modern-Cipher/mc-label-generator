function generateLabels() {
  const form = document.getElementById('labelForm');
  
  // VALIDATION: Ito ang nagsasabi na dapat required lahat ng fields
  if (!form.checkValidity()) {
    form.reportValidity(); // Ipapakita nito kung aling field ang kulang
    return; // Hihinto dito kapag may kulang
  }

  const category = document.getElementById('category').value;
  const weightType = document.getElementById('weightType').value;
  const weightNum = document.getElementById('weightNum').value;
  const paperSize = document.getElementById('paperSize').value;
  const orientation = document.getElementById('orientation').value;

  const productionDate = new Date();
  const bestBeforeDate = new Date();
  bestBeforeDate.setMonth(productionDate.getMonth() + 1);

  const options = { year: 'numeric', month: 'long', day: '2-digit' };
  const formattedPD = productionDate.toLocaleDateString('en-US', options);
  const formattedBB = bestBeforeDate.toLocaleDateString('en-US', options);

  const weightText = `${category} ${weightNum}${weightType}`;
  const container = document.getElementById('labelContainer');
  container.innerHTML = '';

  let allLabelsHtml = '';
  for (let i = 0; i < 15; i++) {
    allLabelsHtml += `
      <div class="label-card">
        <div>
            <img src="assets/images/rakjard.png" alt="Rakjard Logo" class="logo">
            <p>${weightText}</p>
        </div>
        <div class="dates">
            <p><strong>PD:</strong> <u>${formattedPD}</u></p>
            <p><strong>BB:</strong> <u>${formattedBB}</u></p>
        </div>
      </div>
    `;
  }

  container.innerHTML = allLabelsHtml;
  container.style.display = 'grid';

  const pageStyle = document.createElement('style');
  let size = paperSize;
  if (paperSize === "8.5x13") {
    size = "8.5in 13in";
  }
  pageStyle.innerHTML = `@page { size: ${size} ${orientation}; margin: 0.25in; }`;
  document.head.appendChild(pageStyle);

  const images = container.querySelectorAll('img');
  let loadedImages = 0;

  const printAction = () => {
    window.print();
    document.head.removeChild(pageStyle);
    container.style.display = 'none';
  };

  if (images.length === 0) {
    printAction();
  } else {
    images.forEach(img => {
      if (img.complete) {
        loadedImages++;
      } else {
        img.onload = () => {
          loadedImages++;
          if (loadedImages === images.length) {
            printAction();
          }
        };
      }
    });
    if (loadedImages === images.length) {
      printAction();
    }
  }
}