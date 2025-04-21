const body = document.querySelector('body'),
      sidebar = body.querySelector('nav'),
      toggle = body.querySelector(".toggle"), 
      modeSwitch = body.querySelector(".toggle-switch"),
      modeText = body.querySelector(".mode-text");
      searchBtn = body.querySelector(".search-box"),


toggle.addEventListener("click" , () =>{
    sidebar.classList.toggle("close");
})

if (searchBtn) {
  searchBtn.addEventListener("click", () =>{
      sidebar.classList.remove("close");
  });
}

if (modeSwitch) {
   modeSwitch.addEventListener("click", () =>{
     body.classList.toggle("dark");

     if (body.classList.contains("dark")) {
       modeText.innerText = "Light mode";
     } else {
       modeText.innerText = "Dark mode";
     }
   });
 }
