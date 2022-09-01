function hDialog() {
	const dialogs = document.getElementsByTagName("h-dialog");
	
	for (let i = 0; i < dialogs.length; i++) {
		let element = dialogs.item(i);
		
		let contents = element.innerHTML;
		element.innerHTML = "";
		
		let headerAtt = element.attributes.header;
		
		let closeableAtt = element.attributes.closeable;
		let closeable = true;
		if (closeableAtt) {
			closeable = (closeableAtt.value === "true");
		}
		
		let onshowAtt = element.attributes.onshow;
		if (onshowAtt) {
			element.onshowCallback = onshowAtt.value;
		}
		
		let onhideAtt = element.attributes.onhide;
		if (onhideAtt) {
			element.onhideCallback = onhideAtt.value;
		}
		
		let widthAtt = element.attributes.width;
		let width = 80;
		let heightAtt = element.attributes.height;
		let height = 80;
		if (widthAtt) {
			width = parseInt(widthAtt.value);
		}
		if (heightAtt) {
			height = parseInt(heightAtt.value);
		}
		
		let dialogContainer = document.createElement("div");
		dialogContainer.classList.add("h-dialog-container");
		
		if (!isNaN(width)) {
			dialogContainer.style.width = width + "%";
		} else {
			dialogContainer.style["max-width"] = "100%";
		}
		
		if (!isNaN(height)) {
			dialogContainer.style.height = height + "%";
		} else {
			dialogContainer.style["max-height"] = "100%";
		}
		
		let header = document.createElement("h-dialog-header");
		let body = document.createElement("h-dialog-body");
		let bodyInner = document.createElement("div");
		bodyInner.classList.add("h-dialog-body-inner");
		
		bodyInner.innerHTML = contents;
		body.appendChild(bodyInner);
		
		let headerCloseButtonDiv = document.createElement("div");
		headerCloseButtonDiv.classList.add("h-dialog-header-close-button-container");
		
		let headerPadding, headerTextDiv;
		if (headerAtt) {
			headerPadding = document.createElement("div");
			headerTextDiv = document.createElement("div");
			
			headerTextDiv.classList.add("h-dialog-header-text");
			let headerText = document.createElement("h1");
			headerText.appendChild(document.createTextNode(headerAtt.value));
			headerTextDiv.appendChild(headerText);
		}
		
		let headerCloseButton = document.createElement("a");
		headerCloseButton.classList.add("h-dialog-header-close-button", "fa", "fa-times");
		headerCloseButton.parent = element;
		headerCloseButton.addEventListener("click", function() {
			this.parent.hide();
		});
		
		headerCloseButtonDiv.appendChild(headerCloseButton);
		
		if (headerAtt) {
			if (closeable) {
				header.appendChild(headerPadding);
			}
			header.appendChild(headerTextDiv);
			if (closeable) {
				header.appendChild(headerCloseButtonDiv);
			}
			dialogContainer.appendChild(header);
		} else if (closeable) {
			// Couldn't find a better solution that also
			// accommodated the default overflow behavior
			body.classList.add("no-header");
			body.appendChild(headerCloseButtonDiv);
		}
		
		dialogContainer.appendChild(body);
		
		element.appendChild(dialogContainer);
		
		element.classList.add("closed");
		
		element.hide = function() {
			this.classList.add("closing");
			this.classList.remove("closed");
			this.classList.remove("opening");
			this.hideTimeout = setTimeout(() => {
				this.classList.add("closed");
				this.classList.remove("closing");
			}, 500);
			
			if (this.onhideCallback) {
				eval( this.onhideCallback );
			}
		};
		
		element.show = function() {
			this.classList.remove("closing");
			this.classList.remove("closed");
			this.classList.add("opening");
			clearTimeout(this.hideTimeout);
			
			if (this.onshowCallback) {
				eval( this.onshowCallback );
			}
		};
	}
}

hDialog();

function hSidebar() {
	const sidebars = document.getElementsByTagName("h-sidebar");
	
	for (let i = 0; i < sidebars.length; i++) {
		let element = sidebars.item(i);
		
		let contents = element.innerHTML;
		element.innerHTML = "";
		
		element.classList.add("closed");
		
		// let menuEmpty = document.createElement("div");
		// menuEmpty.classList.add("h-sidebar-empty");
		// 
		// element.appendChild(menuEmpty);
		
		let hSidebarContainer = document.createElement("div");
		hSidebarContainer.classList.add("h-sidebar-container");
		let hSidebarBody = document.createElement("div");
		hSidebarBody.classList.add("h-sidebar-body");
		let hSidebarBodyInner = document.createElement("div");
		hSidebarBodyInner.classList.add("h-sidebar-body-inner");
		hSidebarBody.appendChild(hSidebarBodyInner);
		
		hSidebarBodyInner.innerHTML = contents;
		
		let hSidebarClose = document.createElement("div");
		hSidebarClose.classList.add("h-sidebar-close");
		let hSidebarCloseButton = document.createElement("a");
		hSidebarCloseButton.classList.add("h-sidebar-close-button", "fa", "fa-times");
		hSidebarCloseButton.parent = element;
		hSidebarCloseButton.addEventListener("click", function() {
			this.parent.hide();
		});
		hSidebarClose.appendChild(hSidebarCloseButton);
		
		hSidebarContainer.appendChild(hSidebarClose);
		hSidebarContainer.appendChild(hSidebarBody);
		
		element.appendChild(hSidebarContainer);
		
		let onshowAtt = element.attributes.onshow;
		if (onshowAtt) {
			element.onshowCallback = onshowAtt.value;
		}
		
		let onhideAtt = element.attributes.onhide;
		if (onhideAtt) {
			element.onhideCallback = onhideAtt.value;
		}
		
		element.hide = function() {
			this.classList.remove("closed");
			this.classList.remove("opening");
			this.classList.add("closing");
			this.hideTimeout = setTimeout(() => {
				this.classList.add("closed");
				this.classList.remove("closing");
			}, 500);
			
			if (this.onhideCallback) {
				eval( this.onhideCallback );
			}
		}
		
		element.show = function() {
			this.classList.remove("closed");
			this.classList.remove("closing");
			this.classList.add("opening");
			clearTimeout(this.hideTimeout);
			
			if (this.onshowCallback) {
				eval( this.onshowCallback );
			}
		}
	}
}

hSidebar();

function hNotification() {
	const notifications = document.getElementsByTagName("h-notification");
	
	for (let i = 0; i < notifications.length; i++) {
		// You only truly ever need one, to be fair
		let element = notifications.item(i);
		
		let holdDuration = 2000; // In milliseconds
		
		element.holdDuration = holdDuration;
		
		element.showMessage = function(message) {
			let messageElement = document.createElement("h-notification-message");
			
			messageElement.parent = this;
			messageElement.holdDuration = this.holdDuration;
			
			messageElement.innerHTML = message;
			
			messageElement.classList.add("opening");
			messageElement.show = function() {
				this.lifespan = setTimeout( () => {
					this.classList.remove("opening");
					this.classList.add("closing");
					
					//After closing animation plays out
					this.lifespan = setTimeout( () => {
						this.parent.removeChild(this);
					}, 500);
				}, 500 + this.holdDuration);
			};
			
			messageElement.show();
			
			element.appendChild(messageElement);
		}
	}
}

hNotification();

function hButton() {
	const buttons = document.getElementsByTagName("h-button");
	
	for (let i = 0; i < buttons.length; i++) {
		let element = buttons.item(i);
		
		let iconAtt = element.getAttribute("icon");
		if (iconAtt) {
			let iconElement = document.createElement("span");
			iconElement.classList.add("h-button-icon");
			let iconClasses = iconAtt.split(" ");
			for (let i = 0; i < iconClasses.length; i++) {
				iconElement.classList.add(iconClasses[i]);
			}
			
			element.appendChild(iconElement);
		}
		
		let labelAtt = element.getAttribute("label");
		if (labelAtt) {
			let labelElement = document.createElement("span");
			labelElement.classList.add("h-button-label");
			labelElement.innerHTML = labelAtt;
			
			element.appendChild(labelElement);
		}
	}
}

hButton();

var postProcess = [];

function hContainer() {
	const containers = document.getElementsByTagName("h-container");
	
	for (let i = 0; i < containers.length; i++) {
		let element = containers.item(i);
		
		let renderAtt = element.getAttribute("render");
		element.render = true;
		element.classList.add("visible");
		if (renderAtt) {
			element.renderVar = renderAtt;
		}
		
		element.update = function() {
			if (this.renderVar) {
				this.render = eval(this.renderVar);
				if (this.render) {
					element.classList.add("visible");
					element.classList.remove("hidden");
				} else {
					element.classList.remove("visible");
					element.classList.add("hidden");
				}
			}
		}
		
		let autoupdateFunctionAtt = element.attributes["autoupdate-function"];
		if (autoupdateFunctionAtt) {
			element.autoupdateFunction = autoupdateFunctionAtt.value;
		}
		
		let autoupdateTimerAtt = element.attributes["autoupdate-timer"];
		element.autoupdateTimer = 10;
		if (autoupdateTimerAtt) {
			element.autoupdateTimer = parseInt(autoupdateTimerAtt.value);
		}
		
		let autoupdateAtt = element.attributes.autoupdate;
		if (autoupdateAtt && autoupdateAtt.value === "true") {
			element.autoupdate = function() {
				if (this.autoupdateFunction) {
					eval(this.autoupdateFunction);
				}
				
				if (this.update) {
					this.update();
				}
				
				this.autoupdateCountdown = setTimeout( () => {
					this.autoupdate();
				}, this.autoupdateTimer);
			}
			
			element.autoupdate();
		}
		
		postProcess.push(element);
	}
}

hContainer();

function hSwitch() {
	const switches = document.getElementsByTagName("h-switch");
	
	for (let i = 0; i < switches.length; i++) {
		let element = switches.item(i);
		
		let leftAtt = element.attributes.left;
		let rightAtt = element.attributes.right;
		
		let varAtt = element.attributes.var;
		
		let switchElement = document.createElement("h-switch-button");
		
		element.setAttribute("value", false);
		
		if (varAtt) {
			element.variable = varAtt.value;
			
			element.update = function() {
				let varAtt = this.attributes.var;
				
				let trueValue = window[varAtt.value];
				this.value = trueValue;
				this.setAttribute("value", trueValue);
			}
			
			postProcess.push(element);
		}
		
		console.log(element);
		
		element.onclickPost = element.onclick;
		
		if (leftAtt) {
			let leftText = document.createElement("span");
			leftText.classList.add("h-switch-label");
			leftText.classList.add("h-switch-left");
			leftText.appendChild(document.createTextNode(leftAtt.value));
			element.appendChild(leftText);
		}
		
		element.appendChild(switchElement);
		
		if (rightAtt) {
			let rightText = document.createElement("span");
			rightText.classList.add("h-switch-label");
			rightText.classList.add("h-switch-right");
			rightText.appendChild(document.createTextNode(rightAtt.value));
			element.appendChild(rightText);
		}
		
		let action = function() {
			this.value = !this.value;
			this.setAttribute("value", this.value);
			if (this.variable) {
				window[this.variable] = this.value;
			}
		}
		if (element.onclick) {
			// Is this considered cheating?
			element.onclick = function() {
				action.call(this);
				this.onclickPost();
			}
		} else {
			element.addEventListener("click", function() {
				action.call(this);
			}, false);
		}
			
	}
}

hSwitch();

function hVar() {
	const vars = document.getElementsByTagName("h-var");
	
	for (let i = 0; i < vars.length; i++) {
		let element = vars.item(i);
		
		let defaultVar = "";
		let defaultAtt = element.attributes.default;
		if (defaultAtt) {
			defaultVar = defaultAtt.value;
		}
		element.innerHTML = defaultVar;
		
		element.update = function() {
			let varAtt = this.attributes.var;
			
			let trueValue = window[varAtt.value];
			this.value = trueValue;
			if (trueValue !== undefined) {
				this.innerHTML = trueValue;
			}
		}
		
		let autoupdateFunctionAtt = element.attributes["autoupdate-function"];
		if (autoupdateFunctionAtt) {
			element.autoupdateFunction = autoupdateFunctionAtt.value;
		}
		
		let autoupdateTimerAtt = element.attributes["autoupdate-timer"];
		element.autoupdateTimer = 10;
		if (autoupdateTimerAtt) {
			element.autoupdateTimer = parseInt(autoupdateTimerAtt.value);
		}
		
		let autoupdateAtt = element.attributes.autoupdate;
		if (autoupdateAtt && autoupdateAtt.value === "true") {
			element.autoupdate = function() {
				if (this.autoupdateFunction) {
					eval(this.autoupdateFunction);
				}
				
				if (this.update) {
					this.update();
				}
				
				this.autoupdateCountdown = setTimeout( () => {
					this.autoupdate();
				}, this.autoupdateTimer);
			}
			
			element.autoupdate();
		}
		
		postProcess.push(element);
	}
}

hVar();

function hProgressbar() {
	const progressbars = document.getElementsByTagName("h-progressbar");
	
	for (let i = 0; i < progressbars.length; i++) {
		let element = progressbars.item(i);
		
		let barChild = document.createElement("h-progressbar-bar");
		//Not to be confused with a child you have at the bar
		element.barElement = barChild;
		let barChildInner = document.createElement("div");
		barChildInner.classList.add("h-progressbar-innerbar");
		barChild.appendChild(barChildInner);
		barChild.innerbarElement = barChildInner;
		
		element.appendChild(barChild);
		
		element.update = function() {
			let varAtt = this.attributes.var;
			let maxAtt = this.attributes.max;
			let inlineAtt = this.attributes.inline;
			
			let trueValue = window[varAtt.value];
			let maxValue = 100;
			let inline = false;
			if (maxAtt) {
				let maxValueData = window[maxAtt.value];
				if (maxValueData !== undefined) {
					maxValue = maxValueData;
				}
			}
			if (inlineAtt && inlineAtt.value === "true") {
				inline = true;
			}
			this.value = trueValue;
			if (trueValue !== undefined) {
				let percentage = 0;
				if (maxAtt !== 0) {
					percentage = (trueValue / maxValue * 100);
				}
				this.barElement.style.width = percentage + "%";
			} else {
				this.barElement.style.width = "0%";
			}
			
			if (inline) {
				this.barElement.innerbarElement.innerHTML = this.value;
			}
		}
		
		postProcess.push(element);
	}
}

hProgressbar()

function processTags() {
	for (let i = 0; i < postProcess.length; i++) {
		let element = postProcess[i];
		
		if (element.update) {
			element.update();
		}
	}
}
