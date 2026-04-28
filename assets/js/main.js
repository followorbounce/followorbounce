document.querySelectorAll('.has-submenu button').forEach(btn=>{
btn.addEventListener('click',()=>{
btn.nextElementSibling.classList.toggle('open');
});
});
