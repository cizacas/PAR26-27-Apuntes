document.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = decodeURIComponent(a.getAttribute("href").substring(1));
    if (document.getElementById(id)) {
        console.log("OK:", id);
    } else {
        console.log("NO ENCONTRADO:", id);
    }
});