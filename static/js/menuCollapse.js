const coll = document.querySelectorAll(".collapsible");
coll.forEach(el => {
    el.addEventListener("click", function() {
        const content = this.nextElementSibling;
        content.style.display = content.style.display === "none" ? "block" : "none"
        this.classList.toggle("exp")
        this.classList.toggle("ctr")
    });
})