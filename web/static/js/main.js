const COLLAPSIBLE_CONFIG = {
    //accordion: false
};
const SELECT_CONFIG = {

};
const TOOLTIP_CONFIG = {
    enterDelay: 0,
    exitDelay: 0
};
const MODAL_CONFIG = {

};

$(document).ready(function() {
    // Initialize MaterializeCSS components
    $(".collapsible").collapsible(COLLAPSIBLE_CONFIG);
    $("select").formSelect(SELECT_CONFIG);
    $(".tooltipped").tooltip(TOOLTIP_CONFIG);
    $(".modal").modal(MODAL_CONFIG);
});
