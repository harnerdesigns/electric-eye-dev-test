window.onload = function() {
  let ee_buttons = document.getElementsByClassName("ee-atc-btn");

  for (let i = 0; i < ee_buttons.length; i++) {
    ee_buttons[i].onclick = function(e) {
      e.preventDefault();
      var variantID = this.dataset.variant_id;
      var clicked = this;

      if (clicked.dataset.redirect === "true") {
        // Buy Now Should Only Checkout with selected product, regardless of what was already in cart.
        ee_clearCart().then(() => {
          ee_buyNow(clicked, variantID);
        });
      } else {
        ee_buyNow(clicked, variantID);
      }
    };
  }

  let ee_dropdowns = document.getElementsByClassName("ee-variant-dropdown");

  for (let i = 0; i < ee_dropdowns.length; i++) {
    ee_dropdowns[i].onchange = ee_variantSelectChanged;
  }
};

function ee_buyNow(clicked, variantID) {
  var parentDiv = clicked.closest("div");
  var themeProduct = new window.theme.Product(parentDiv);

  ee_toggleLoading(clicked, true);

  fetch("/cart/add.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ id: variantID, quantity: 1, form_type: "product" }],
    }),
  }).then(function(data) {
    ee_toggleLoading(clicked, false);

    var response = data.json().then(function(response) {
      if (data.status === 200) {
        console.log(response);
        themeProduct._setupCartPopup(response.items[0]);
        if (clicked.dataset.redirect === "true") {
          window.location = "/checkout";
        }
      } else {
        parentDiv.querySelector(
          "div[data-error-message-wrapper]"
        ).style.display = "block";
        parentDiv.querySelector("span[data-error-message]").innerHTML =
          response.description;
      }
    });
  });
}

function ee_variantSelectChanged(e) {
  var self = e.target;
  var parentDiv = self.closest("div");
  var currentImg = parentDiv.querySelector(".product-card__image-wrapper img");
  var currentURL = parentDiv.querySelector("a");
  var currentATCButton = parentDiv.querySelector(".ee-atc-btn");
  var currentATCButtonLabel = currentATCButton.querySelector("span");

  var selectedOption = self.querySelector("option:checked");
  var selectedId = selectedOption.dataset.variant_id;
  var selectedPrice = selectedOption.dataset.variant_price;
  var selectedImage = selectedOption.dataset.variant_image_url;
  var selectedURL = selectedOption.dataset.variant_url;
  var selectedAvailable = "true" === selectedOption.dataset.variant_available;

  if (selectedAvailable) {
      // Resetting ATC Button if a Out Of Stock Option was selected first.
    currentATCButtonLabel.innerHTML = currentATCButtonLabel.dataset.og_atc_text;
    currentATCButton.removeAttribute('disabled');


    // Change Add To Cart Button Variant ID
    currentATCButton.dataset.variant_id = selectedId;
    parentDiv.querySelector(
      ".price .price__regular dd .price-item"
    ).innerHTML = selectedPrice;

    // Change Image
    if (selectedImage != "" && !selectedImage.includes("no-image")) {
      //Clear Out Old Image
      currentImg.removeAttribute("srcset");
      currentImg.removeAttribute("sizes");
      currentImg.removeAttribute("src");
      currentImg.dataset.srcset = "";
      currentImg.dataset.widths = "";
      currentImg.classList.remove("lazyloaded");

      // Set New Image and Trigger Lazy Load
      currentImg.dataset.src = selectedImage;
      currentImg.classList.add("lazyload");
    }

    // Change Link URL
    if (selectedURL != "") {
      currentURL.setAttribute("href", selectedURL);
    }
  } else {
    // User Somehow Selected an "Out of Stock" Variant
    currentATCButtonLabel.innerHTML = "Sold Out";
    currentATCButton.setAttribute('disabled', "true")
  }
}

function ee_toggleLoading(clicked, disable) {
  if (disable) {
    clicked.querySelector("[data-add-to-cart-text]").classList.add("hide");
    clicked.querySelector("[data-loader]").classList.remove("hide");
    clicked.setAttribute("disabled", true);
  } else {
    clicked.querySelector("[data-add-to-cart-text]").classList.remove("hide");
    clicked.querySelector("[data-loader]").classList.add("hide");
    clicked.removeAttribute("disabled");
  }
}

function ee_clearCart(cb) {
  return fetch("/cart/clear.js", {
    method: "POST",
    dataType: "text",
  });
}
