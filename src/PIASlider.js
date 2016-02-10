/**
 * Slider
 */
var PIASlider = (function(){

  /**
   * Opciones por defecto.
   * @type {Object}
   */
  var defaultOptions = {
    // Selector de controles
    controlSelector: '.slider-controls',

    // Generar controles
    buildControls : true,

    // Tiempo de transición
    animTime: 500,

    // Slide activo inicial
    activeIndex: 0,

    // Función de animación para transiciones
    easing: "swing",

    // Tiempo de espera entre slides (ms)
    slideTime: 1500,

    // Iniciar slider automáticamente
    autoPlay: true,

    // Pausar slider al pasar el mouse
    pauseOnHover: true,

    // Tipo de animación para transiciones
    animType: "horizontal"
  };
  
  // registro interno sliders
  var sliders = {};
  // contador sliders creados para generar IDs
  var sliderCount = 0;
  
  // Genera ID para cada slider creado
  var sliderID = function(){
    return 's'+(++sliderCount);
  };
  
  // Registrar nuevo slider
  var sliderRegister = function(id, api){
    sliders[id] = api;
  };
  
  // Recupera slider creado
  var sliderGet = function(id){
    return sliders[id] || null;
  };
  
  // Elimina slider del registro
  var sliderRemove = function(id){
    delete sliders[id];
  };
  
  // tipos de animación disponibles para los sliders.
  var animTypes = {
    
    // Sin animación
    "none": function(opts, $prev, $next, dir, size){
      $prev.stop(true, true);
      $next.stop(true, true);
      $prev.removeClass('inactive');
      $next.removeClass('inactive');
      $prev.css({
        "opacity": 1,
        "top": 0,
        "left": 0,
        "z-index": 1
      });
      $next.css({
        "opacity": 1,
        "z-index": 2,
        "left": 0,
        "top": 0
      });
      $prev.addClass("inactive");
    },

    
    // Animación: Movimiento horizontal
    "horizontal": function(opts, $prev, $next, dir, size){
      $prev.stop(true, true);
      $next.stop(true, true);
      $prev.removeClass('inactive');
      $next.removeClass('inactive');


      $prev.css({
        "opacity": 1,
        "top" : 0,
        "left" : 0,
        "z-index": 1
      });

      $next.css({
        "opacity": 1,
        "z-index" : 2,
        "left": (-dir*size.width)+'px',
        "top" : 0
      });


      $prev.animate({
        'left' : (dir*size.width)+'px'
      }, opts.animTime, opts.easing, function(){
        $prev.addClass('inactive');
      });

      $next.animate({
        'left': 0
      }, opts.animTime, opts.easing);
    },
    
    
    // Animación: movimiento vertical
    "vertical": function(opts, $prev, $next, dir, size){
      $prev.css({
        "opacity": 1,
        "z-index": 1,
        "left": 0,
        "top": 0
      });
      $next.css({
        "opacity": 1,
        "left": 0,
        "z-index": 2,
        "top": (-dir*size.height)+'px'
      });
      
      $next.addClass('active');
      $prev.animate({
        'top': (dir*size.height)+'px'
      }, opts.animTime, opts.easing, function(){
        $prev.addClass('inactive');
      });
      
      $next.animate({
        'top': 0
      }, opts.animTime, opts.easing);
    },
    
    // Animación: desvanecer
    "fade": function(opts, $prev, $next, dir, size) {

      $next.addClass('active');
      $prev.css({
        "z-index": 1,
        "top": 0,
        "left": 0,
        "opacity": 1
      });

      $next.css({
        "z-index": 2,
        "opacity": 0,
        "top": 0,
        "left": 0
      });
      
      $next.fadeTo(opts.animTime, 1, function(){
        $prev.addClass('inactive');
      });
    },

    // Animación: aleatoria (incluye todas excepto 'none')
    "random": function(opts, $prev, $next, dir, size) {
      var animKeys = $.map(animTypes, function(elem,index){ return index; });
      animKeys = $.grep(animKeys, function(elem,index){ return elem != 'none' && elem != 'random'; });
      var randKey = Math.floor(Math.random()*animKeys.length);
      animTypes[animKeys[randKey]].apply(this, [opts, $prev, $next, dir, size]);
    }
  };
  
  /**
   * Permite extender la funcionalidad de PIASlider.
   * 
   * La función llamada recibe la API General de PIASlider
   * - plugin
   * - getSlider
   * - removeSlider
   * - getSliders
   * - create
   */
  var plugin = function(pluginFunc){
    pluginFunc({
      defaultOptions: defaultOptions,
      animTypes: animTypes,
      api: generalAPI
    });
  };
  
  
  /**
   * Crea un slider
   *
   * @param string selector Indica el elemento en el que crear el slider.
   * @param object options Opciones a pasar al slider
   */
  var sliderCreate = function(selector, options)
  {
    var id = sliderID();
    var opts = $.extend({}, defaultOptions, options);
    var $container = (selector instanceof jQuery ? selector : $(selector));
    var $slider = $container.find('.slider');
    var $controls = $container.find(opts.controlSelector);
    var slideTm = 0;
    var playing = false;
    
    var getAnimFunc = function(){
      if($.isFunction(opts.animType)){
        return opts.animType;
      } else {
        return animTypes[opts.animType];
      }
    };
    
    var getID = function()
    {
      return id;
    };
    
    var play = function()
    {
      stop();
      slideTm = setTimeout(playNext, opts.slideTime);
    };

    var pause = function()
    {
      if(playing){
        stop();
      } else {
        play();
      }
    };

    /**
     * Parar slider
     */
    var stop = function(){
      clearTimeout(slideTm);
      playing = false;
    };

    /**
     * Ir a siguiente slide (temporizador)
     */
    var playNext = function(){
      stop();
      playing = true;
      nextSlide();
      slideTm = setTimeout(playNext, opts.slideTime);
    };

    /**
     * Devuelve un número entre 0 y el máximo,
     * utilizando el módulo de n y máximo.
     */
    var getCyclic = function(n, maxN){
      return (maxN + (n % maxN)) % maxN;
    };

    /**
     * Recupera los slides actuales.
     */
    var getSlides = function(){
      return $slider.find('.slide');
    };

    /**
     * número de slides.
     */
    var getSlideCount = function(){
      return getSlides().length;
    };

    /**
     * Slide activo (indice)
     */
    var getActiveIndex = function(){
      return getSlides().filter('.active').index();
    };

    /**
     * Medidas del slider.
     */
    var getSize = function(){
      return {
        width: $slider.width(),
        height: $slider.height()
      };
    };

    /**
     * Handler para pulsación en control de slider.
     */
    var controlClick = function(ev){
      var index = $(this).data('index');
      gotoSlide(index);
     };

    /**
     * Genera los controles.
     */
    var buildControls = function(){
      if($controls.length === 0){
        $controls = $('<div class="slider-controls"></div>');
        $controls.appendTo($container);
      }
      var slideCount = getSlideCount();
      for(var i = 0; i < slideCount; i++){
         var $control = $('<a href="#"></a>');
         $control.addClass('slider-control-item');
         $control.html('');
         $control.attr('data-index', i);
         $control.data('index', i);
         $control.on('click', controlClick);
         $control.appendTo($controls);
      }
    };


    /**
     * Iniciar los slides ( ocultar, etc)
     */
    var initSlides = function()
    {
        $container.hover(function(){
          if(opts.autoPlay && opts.pauseOnHover){
            stop();
          }
        }, function(){
          if(opts.autoPlay && opts.pauseOnHover){
            play();
          }
        });

      var $slides = getSlides();
      $slides.addClass('inactive');
      var $activeSlide = $slides.eq(opts.activeIndex);
      $activeSlide.removeClass('inactive');
      $activeSlide.addClass('active');
      updateControls();
    };

    /**
     * Actualizar controles para reflejar estado actual de slider.
     */
    var updateControls = function()
    {
      var activeIndex = getActiveIndex();
      var $controlItems = $controls.find('.slider-control-item');
      var $cControl = $controlItems.eq(activeIndex);
      $controlItems.not(':eq('+activeIndex+')').removeClass('active');
      $cControl.addClass('active');
    };


    /** 
     * Ir a slide, calcula número dentro del total de slides,
     * de modo que -1 = num slides - 1
     */
    var gotoSlide = function(n){
      stop();
      var activeIndex = getActiveIndex();
      var $slides = getSlides();
      var slideCount = getSlideCount();
      var dir = 0;

      n = getCyclic(n, slideCount);
      if(activeIndex != n){
        dir = -(n - activeIndex);
        dir = dir / Math.abs(dir);
        if(activeIndex === slideCount - 1 && n === 0) dir = -1;
      } else {
        return;
      }

      var $cSlide = $slides.eq(activeIndex);
      var $nSlide = $slides.eq(n);
      var size = getSize();

      var animFunc = getAnimFunc();
      $nSlide.stop();
      $cSlide.stop();
      $nSlide.addClass('active');
      $cSlide.removeClass('active');
      $nSlide.removeClass('inactive');
      $cSlide.removeClass('inactive');
      animFunc(opts, $cSlide, $nSlide, dir, size);
      updateControls();
      $container.trigger('pia.slider.slide', [{ 
        slider: sliderAPI,
        index: n, 
        prevIndex: activeIndex, 
        $prev: $cSlide, 
        $next : $nSlide}]);
    };
    

    /**
     * Siguiente Slide.
     */
    var nextSlide = function(){
      gotoSlide(getActiveIndex() + 1);
    };

    /**
     * Slide Anterior.
     */
    var prevSlide = function(){
      gotoSlide(getActiveIndex() - 1);
    };

    // Generar botones de control 
    if(opts.buildControls){
      buildControls();
    }

    // Inicializar slides
    initSlides();

    // Iniciar slider
    if(opts.autoPlay){
      play();
    }

    /**
     * Especificar opción
     * 
     * @param {string} optKey   Nombre de la opción
     * @param {object} optValue Valor de la opción
     */
    var setOption = function(optKey, optValue){
      opts[optKey] = optValue;
    };

    /**
     * Recuperar opción
     * 
     * @param  {string} optKey     Nombre de la opción
     * @param  {object} defaultVal Valor por defecto
     * @return {object}            
     */
    var getOption = function(optKey, defaultVal){
      return opts[optKey] || defaultVal;
    };
    
    
    /**
     * Funciones disponibles externamente (por cada slider)
     * @type {Object}
     */
    var sliderAPI = {
      $element: $container,
      gotoSlide : gotoSlide,
      nextSlide: nextSlide,
      prevSlide: prevSlide,
      slideCount: getSlideCount,
      play: play,
      pause: pause,
      stop: stop,
      setOption: setOption,
      getOption: getOption,
      getID: getID,
      getSize: getSize
    };
    
    sliderRegister(id, sliderAPI);
    return sliderAPI;
  };
  
  /**
   * Recuperar sliders registrados.
   * 
   * @return {array} Array de sliders registrados.
   */
  var slidersGet = function(){
    return sliders;
  };
  
  /**
   * Funciones disponibles externamente. (Global de PIASlider)
   * @type {Object}
   */
  var generalAPI = {
      plugin: plugin,
      getSlider: sliderGet,
      getSliders: slidersGet,
      removeSlider: sliderRemove,
      create: sliderCreate
  };
  return generalAPI;
})();
