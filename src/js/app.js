App = {
	init: function() {
		console.log("App initialized...")
	}
}

$(function() {
	$(window).load(function() {
		App.init();
	})
});