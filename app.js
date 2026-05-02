window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("loading-screen").style.display = "none";
        document.getElementById("app").style.display = "block";
    }, 2600); // matches animation timing
});
