document.addEventListener("DOMContentLoaded", () => {
  // ===== CONFIGURATION =====
  // Dito mo ilalagay ang data para sa bawat brand.
  const brands = [
    {
      image: "../../assets/images/rakjard.png",
      url: "https://drive.google.com/drive/folders/15TCMiyOuZdkCxJ_fIDYSpJwg7YQWU6BK?usp=sharing",
      buttonLabel: "Rakjard",
      buttonClass: "btn-rakjard",
    },
    {
      image: "../../assets/images/ronshe-dragons.png",
      url: "https://drive.google.com/drive/folders/1d7dSrpYCzMywQyehlOiGBbYFIJLZyT1W?usp=sharing", // Ito yung para sa "Contact Admin"
      buttonLabel: "Ronshe Dragons",
      buttonClass: "btn-ronshe",
    },
    {
      image: "../../assets/images/dragon-angels.png",
      url: "https://drive.google.com/drive/folders/1hhTuJ17DyCJl4hfH3WjQ1z5fJlbqt2RX?usp=sharing",
      buttonLabel: "Dragon Angels",
      buttonClass: "btn-dragon-angels",
    },
    {
      image: "../../assets/images/chicha-crush.png",
      url: "https://drive.google.com/drive/folders/1tOZ1hAQNZ6RdAE23ol9UfiN0ov1c4RO0?usp=sharing",
      buttonLabel: "Chicha Crush",
      buttonClass: "btn-chicha-crush",
    },
    {
      image: "../../assets/images/flavoMix.png",
      url: "https://drive.google.com/drive/folders/1NCNq21JvnMIDAaZPF7Ke2PglUjRalgrH?usp=sharing", // Ito yung bago para sa "Subscription" alert
      buttonLabel: "Flavo Mix",
      buttonClass: "btn-flavomix",
    },
    // --- MGA BAGONG CARD (Naka-lock lahat) ---
    {
      image: "../../assets/images/folder.png",
      url: "", // Ito yung para sa "Pro Version"
      buttonLabel: "Brand Six",
      buttonClass: "btn-locked-brand",
    },
    {
      image: "../../assets/images/folder.png",
      url: "", // Ito yung para sa "Pro Version"
      buttonLabel: "Brand Seven",
      buttonClass: "btn-locked-brand",
    },
    {
      image: "../../assets/images/folder.png",
      url: "", // Ito yung para sa "Pro Version"
      buttonLabel: "Brand Eight",
      buttonClass: "btn-locked-brand",
    },
  ];

  const brandContainer = document.getElementById("brand-container");
  if (!brandContainer) return;

  brands.forEach((brand) => {
    // --- KINUHA ANG IBA'T IBANG URI NG LOCK ---
    const isProLock = brand.url === "";
    const needsAdmin = brand.url === "#";
    const isSubscriptionLock = brand.url === "/";

    // Ang button text ay "Locked" kung alinman sa dalawang lock type ang totoo
    const buttonText = (isProLock || isSubscriptionLock) ? "Locked" : brand.buttonLabel;

    const imageHtml = brand.image
      ? `<img src="${brand.image}" class="card-img-top" alt="${brand.buttonLabel} Logo" />`
      : `<div class="card-img-top no-image-placeholder"><span>No Image</span></div>`;

    const cardCol = document.createElement("div");
    cardCol.className = "col-12 col-sm-6 col-lg-3 d-flex";

    cardCol.innerHTML = `
      <div class="brand-card w-100">
        ${imageHtml}
        <div class="card-body d-flex flex-column">
          <button class="btn btn-outline-custom w-100 mt-auto ${brand.buttonClass}">
            ${buttonText}
          </button>
        </div>
      </div>
    `;

    const button = cardCol.querySelector("button");

    // Lalagyan ng 'locked' class para sa CSS kung alinman sa dalawang lock type ang totoo
    if (isProLock || isSubscriptionLock) {
      button.classList.add("locked");
    }
    
    brandContainer.appendChild(cardCol);

    // --- INAYOS ANG LOGIC NG SWEETALERT ---
    button.addEventListener("click", (e) => {
      e.preventDefault();

      if (isSubscriptionLock) {
        // USE "/" BAGONG ALERT PARA SA SUBSCRIPTION
        Swal.fire({
          icon: "info",
          title: "Subscription Required",
          text: "Please contact the developer to continue your subscription.",
          confirmButtonColor: "#0d6efd",
        });
      } else if (isProLock) {
        // USE "" Alert para sa "Pro version"
        Swal.fire({
          icon: "warning",
          title: "Feature Locked",
          text: "To unlock this, please upgrade to the Pro version!",
          confirmButtonColor: "#0d6efd",
        });
      } else if (needsAdmin) {
        // USE "#" Alert para sa "Contact Admin"
        Swal.fire({
          icon: "info",
          title: "Access Unavailable",
          html: "For access, please contact your<br><b>Administrator</b> or the <b>Developer</b>.",
          confirmButtonColor: "#0d6efd",
        });
      } else {
        // Bubuksan ang link kung valid
        window.open(brand.url, "_blank");
      }
    });
  });
});