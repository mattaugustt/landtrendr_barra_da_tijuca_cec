//######################################################################################################## 
//#                                                                                                    #\\
//#                           LANDTRENDR GREATEST DISTURBANCE MAPPING                                  #\\
//#                                                                                                    #\\
//########################################################################################################


// date: 2018-10-07
// author: Justin Braaten | jstnbraaten@gmail.com
//         Zhiqiang Yang  | zhiqiang.yang@oregonstate.edu
//         Robert Kennedy | rkennedy@coas.oregonstate.edu
// parameter definitions: https://emapr.github.io/LT-GEE/api.html#getchangemap
// website: https://github.com/eMapR/LT-GEE
// notes: 
//   - you must add the LT-GEE API to your GEE account to run this script. 
//     Visit this URL to add it:
//     https://code.earthengine.google.com/?accept_repo=users/emaprlab/public
//   - use this app to help parameterize: 
//     https://emaprlab.users.earthengine.app/view/lt-gee-change-mapper


//##########################################################################################
// START INPUTS
//##########################################################################################

var roi = ee.Geometry.Point(-43.46325686497569, -22.949469188101524);

var barra = ee.FeatureCollection("users/mataugusto1999/LimiteRegioesAdministrativasRA")
.filter(ee.Filter.eq('nomera', 'Barra da Tijuca'));


// define collection parameters
var startYear = 1980;
var endYear = 2024;
var startDay = '06-20';
var endDay = '05-20';
var index = 'NDVI';
var maskThese = ['cloud', 'shadow', 'water'];



// define landtrendr parameters
var runParams = { 
  maxSegments:            3,
  spikeThreshold:         1.5,
  vertexCountOvershoot:   3,
  preventOneYearRecovery: true,
  recoveryThreshold:      0.25,
  pvalThreshold:          0.05,
  bestModelProportion:    0.75,
  minObservationsNeeded:  6
};

// define change parameters
var changeParams = {
  delta:  'loss',
  sort:   'greatest',
  year:   {checked:true, start:1984, end:2024},
  mag:    {checked:true, value:100,  operator:'>'},
  dur:    {checked:false, value:4,    operator:'<'},
  preval: {checked:false, value:300,  operator:'>'},
  mmu:    {checked:false, value:11},
  
};

//##########################################################################################
// END INPUTS
//##########################################################################################

// load the LandTrendr.js module
var ltgee = require('users/emaprlab/public:Modules/LandTrendr.js'); 



//tentar adicionar o indice ndbi aqui! e colocar como índice;


// add index to changeParams object
changeParams.index = index;

// run landtrendr
var lt = ltgee.runLT(startYear, endYear, startDay, endDay, roi, index, [], runParams, maskThese);

// get the change map layers
var changeImg = ltgee.getChangeMap(lt, changeParams);

//recortando para a Barra:
var clipBarra = changeImg.clip(barra);

// set visualization dictionaries
var palette = ["25ff00","fffa0e","ff2c14"];
var yodVizParms = {
  min: startYear,
  max: endYear,
  palette: palette
};

var magVizParms = {
  min: 100,
  max: 960,
  palette: palette
};


// display the change attribute map - note that there are other layers - print changeImg to console to see all
Map.centerObject(barra, 12);
Map.addLayer(barra, {color:'DarkSlateGray'}, 'Barra da Tijuca')
Map.addLayer(clipBarra.select(['mag']), magVizParms, 'Magnitude Barra');
Map.addLayer(clipBarra.select(['yod']), yodVizParms, "Ano de detecção Barra");
// Map.addLayer(changeImg.select(['mag']), magVizParms, 'Magnitude of Change');
// Map.addLayer(changeImg.select(['yod']), yodVizParms, 'Year of Detection');

// export change data to google drive
// barra da tijuca
var exportImg = changeImg.clip(barra).unmask(0).short();
Export.image.toDrive({
  image: exportImg, 
  description: 'lt_BarraTijuca_NDVI', 
  folder: 'Projeto de SR (Trabalho)', 
  fileNamePrefix: 'lt_BarraTijuca_NDVI', 
  region: barra, 
  scale: 30, 
  crs: 'EPSG:4674', 
  maxPixels: 1e13
});

print(changeImg);


var bandBarra = clipBarra.select(['mag']);

// Contar o número de pixels na imagem
var pixelCount = bandBarra.reduceRegion({
  reducer: ee.Reducer.count(),
  geometry: barra,
  scale: 30,  // Escala em metros (ajuste de acordo com a resolução da imagem)
  maxPixels: 1e13
});

// Exibir o resultado
print('Número total de pixels (Barra):', pixelCount.get('mag'));


// Calcular a área da geometria da FeatureCollection
var area = barra.geometry().area();

// Converter a área para quilômetros quadrados (opcional)
var areaKm2 = area.divide(1e6);

// Imprimir o resultado
print('Área em metros quadrados:', area);
print('Área em quilômetros quadrados:', areaKm2);