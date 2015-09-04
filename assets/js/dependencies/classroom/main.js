var get = document.getElementById.bind(document);

// take care of the header menu
var current_page = document.location.pathname.split('/').pop().split('.')[0], page_found;
var pages = [
	//['index', 'Home'], 
	['about', 'About']  
//	['contribute', 'Contribute'],
	//['contact', 'Contact']
];
 
var ul = document.createElement('ul');
var brand = document.createElement('span');
var pr2 = document.createElement('span');

//brand.innerHTML= '<a id="brand" href="http://www.fabfactory.eu" target="_blank"><img src="../images/cogs-small.png"></a>';
pr2.id = 'header-logo'; 
ul.id = "header-menu";

pr2.addEventListener('click', function() {
	document.location = 'index.php';
});

document.body.insertBefore(ul, document.body.firstElementChild);

document.body.insertBefore(pr2, ul);

document.body.insertBefore(brand, ul.nextElementSibling);	

for(i=0; i< pages.length; i++) {
	var li = document.createElement('li'), a = document.createElement('a');

	a.setAttribute('href', pages[i][0] + '.php');
	a.innerHTML = pages[i][1];
	ul.appendChild(li);
	li.appendChild(a);
 	if(current_page == pages[i][0]) {	page_found = a;	}

}
 
if(typeof page_found == 'undefined') { page_found = ul.children[0].children[0]; }

page_found.classList.add('current-page');
 
function browserInfo() {
	var FF_version = navigator.userAgent.split('Firefox/');
	var valid_version = false;
	var valid_browser = false;
	var version_number = 0;
	 
	var chrome_version = navigator.userAgent.split('Chrome/');  
	if(FF_version.length == 2) {
		version_number = parseInt(FF_version[1].split('.')[0], 10);
		valid_browser = true;
		if(version_number >= 26) valid_version = true;
	}
	else if(chrome_version.length == 2) {
		version_number = parseInt(chrome_version[1].split('.')[0], 10);
		valid_browser= true;
		if(version_number >= 32) valid_version = true;
	}
	
	return {valid_browser : valid_browser, valid_version: valid_version};
}

 
var isValidFF = function() {
	var parts = navigator.userAgent.split('Firefox/');

	if(parts.length == 1) {
		return 'no ff';
	}
	else {
		var ff_version = parseInt(parts[1], 10); 
		if(ff_version <38) {
			return 'old ff';
		}
		else {
			return 'valid ff';
		}
	}
}
 // add faf icon

 //<link rel="shortcut icon" href="images/favico.png" />
var fav = document.createElement('link');

fav.setAttribute('rel', 'shortcut icon');
fav.setAttribute('href', 'images/favico.png');
document.getElementsByTagName('head')[0].appendChild(fav);