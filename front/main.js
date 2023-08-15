import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {Draw, Modify, Snap} from 'ol/interaction.js';
import {OSM, Vector as VectorSource} from 'ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {get} from 'ol/proj.js';
import { Feature } from 'ol';
import $ from 'jquery';

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource();
const vector = new VectorLayer({
  source: source,
  style: {
    'fill-color': 'rgba(230, 255, 255, 0.4)',
    'stroke-color': '#33b4ff',
    'stroke-width': 1,
    'circle-radius': 7,
    'circle-fill-color': '#33b4ff',
  },
});

const extent = get('EPSG:3857').getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];
const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [3854665, 4729726],
    zoom: 4,
    extent,
  }),
});

let draw, snap, modify;
let last_feature;
const modeSelect = document.getElementById('mode');
const typeSelect = document.getElementById('type');
const modal = new bootstrap.Modal(document.getElementById('modal'), {
  keyboard: false
});

function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
  });
  draw.on('drawend', function (e) {
    e.feature.setId(crypto.randomUUID());
    last_feature = e.feature;
    modal.show();
    //CONSOLE
    console.log("Draw finished.");
    console.log(last_feature.getGeometry().getCoordinates());
  });
  map.addInteraction(draw);
  snap = new Snap({source: source});
  map.addInteraction(snap);
}

function clearInteractions() {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  map.removeInteraction(modify);
}


/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  clearInteractions();
  if (!["Polygon", "Point", "LineString"].includes(typeSelect.value)) return;
  addInteractions();
};

modeSelect.onchange = function () {
  clearInteractions();
  if (modeSelect.value === "Draw") {
    typeSelect.disabled = false;
    if (!["Polygon", "Point", "LineString"].includes(typeSelect.value)) return;
    return addInteractions();
  } else if (modeSelect.value === "Edit") {
    modify = new Modify({source: source});
    map.addInteraction(modify);
  }
  typeSelect.disabled = true;
};


// FORM
const form = document.getElementById("modal-form");
form.addEventListener("submit", function(e) {
  modal.hide();
  /*
  appendTable(last_feature.getId(),
  document.getElementById('city').value,
  document.getElementById('district').value,
  document.getElementById('street').value);
  */
  last_feature = null;
  refreshTable();
  clearForm();
});

// form cancel
const button_cancel = document.getElementById("cancelBtn");
button_cancel.addEventListener("click", function() {
  source.removeFeature(last_feature);
  last_feature = null;
  modal.hide();
  clearForm();
});

function clearForm() {
  document.getElementById('city').value = "";
  document.getElementById('district').value = "";
  document.getElementById('street').value = "";
}


function appendTable(featureId, city, district, street) {
  let table = document.getElementById('data').getElementsByTagName('tbody')[0];
  let row = table.insertRow();
  let _id = row.insertCell();
  let _city = row.insertCell();
  let _district = row.insertCell();
  let _street = row.insertCell();
  let _action = row.insertCell();
  _id.innerHTML = featureId;
  _city.innerHTML = city;
  _district.innerHTML = district;
  _street.innerHTML = street;
  //TODO düzenleme
  _action.innerHTML = '<button type="button" class="btn btn-warning btn-sm">Düzenle</button> ' + 
  '<button type="button" id="actionDeleteButton" class="btn btn-danger btn-sm">Sil</button>';
}

function refreshTable() {
  let data = document.getElementById('data');
  for (let x = data.rows.length - 1; x > 0; x--) {
     data.deleteRow(x);
  }
  source.getFeatures().forEach((feature) => {
    let table = document.getElementById('data').getElementsByTagName('tbody')[0];
    let row = table.insertRow();
    let _id = row.insertCell();
    let _city = row.insertCell();
    let _district = row.insertCell();
    let _street = row.insertCell();
    let _action = row.insertCell();
    _id.innerHTML = feature.getId();
    _city.innerHTML = "city";
    _district.innerHTML = "district";
    _street.innerHTML = "street";
    _action.innerHTML = `<button type="button" class="btn btn-warning btn-sm">Düzenle</button> ` + 
    `<button type="button" id="actionDeleteButton" class="btn btn-danger btn-sm">Sil</button>`;
  });
}




$.ajax({
  url: "http://localhost:5158/api/Parsel",
  type: 'GET',
  contentType: 'application/json',
  dataType: 'json',
  success: function(res) {
      console.log(res);
  }
});


