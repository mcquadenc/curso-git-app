//METODO PARA CHAMAR WEBMETHODS
// 1. CRIAR WEB METHOD, RETORNANDO OBJETO DESEJADO
// [WebMethod]
// public static object Get()
function executeWebMethod(methodName, parameters, sucessFunction, errorFunction) {
  $.ajax({
    type: "POST",
    url: methodName,
    data: parameters,
    contentType: "application/json; charset=utf-8",
    dataType: "json"} )
    .done( function (args) {
    //NO .NET o retorno é sempre dentro de um atributo d
    //Verificar se existe
    if ( "d" in args )
    {
      if(sucessFunction != null) sucessFunction(args.d);
      }
      else
      {
      if(sucessFunction != null) sucessFunction(args);
    }
    })
    .fail( function (args) {
      if(errorFunction != null) errorFunction(args);
    }
  );
};

//ADICIONA ITENS EM UMA DROPDOWN (SELECT) A PARTIR DA CHAMADA DE UM WEBMETHOD
// 1. CRIAR UM OBJETO SELECT
//    <select id="ddownSexo" class="dropdown"></select>

// 2. ADICIONAR OS SEGUINTES ATRIBUTOS DE HTML5:

//    OBRIGATÓRIO:
//       -> data-method   : nome do metodo que será chamado.
//                     ex.: data-method="dados.aspx/GetNome"

//    OPCIONAIS:
//       -> data-parameter: parametros do metodo. não informado é passado como "{}"
//      Passar entre "{}".
//          ex.: data-parameter="{ matricula:99999, pessoa:'1' }".

//    EXEMPLO GERAL:
//      <select id="ddown" class="dropdown"  data-method="dadospessoais.aspx/GetList" data-parameter="{}"></select>

// 3. CRIAR WEB METHOD, COM O SEGUINTE RETORNO
// [WebMethod]
// public static object Get()
// {
//   return new System.Web.UI.WebControls.ListItem[];
// }

$.fn.addItems = function (sucessFunction, errorFunction) {
  addSelectItem( this, $(this).attr('data-parameters'), sucessFunction, errorFunction );
};

//ADICIONA ITENS EM UMA DROPDOWN (SELECT) A PARTIR DA CHAMADA DE UM WEBMETHOD COM EFEITO CASCATA
// 1. CRIAR UM OBJETO SELECT
//    <select id="ddownNaturalidadeEstado" class="dropdown"></select>

// 2. ADICIONAR OS SEGUINTES ATRIBUTOS DE HTML5:
//    OBRIGATÓRIO:
//       -> data-method   : nome do metodo que será chamado.
//                     ex.: ASPX = data-method="dadospessoais.aspx/GetListEstado"
//                     ex.: MVC = data-method="Controller/Action"

//    OPCIONAIS:
//     -> data-selected: Valor do item que será selecionado
//          ex.: data-selected="TO"
//       -> data-showfirstoption: Texto da primeira opção que não tem valor. Se não quiser que apareça deve informar "false"
//          ex.: data-showfirstoption="Escolha..." ou data-showfirstoption="false"

//    PARAMETROS PARA "DROP PAI"
//       -> data-category: categoria do select que servirá para filtrar as dropdowns seguintes
//          ex.: data-category="Estado".  A  função vai montar "Estado:TO"
//    PARAMETROS PARA "DROP FILHA"
//       -> data-parentid: id da drop pai
//          ex.: <select id="ddownNaturalidadeLocalidade" class="dropdown" data-parentid="ddownNaturalidadeEstado" data-method="dadospessoais.aspx/GetListLocalidade"></select>
//    EXEMPLO GERAL:
//      <select id="ddownNaturalidadeEstado" class="dropdown" data-method="dadospessoais.aspx/GetListEstado" data-category="Estado" data-selected="TO"></select>

// 3. CRIAR WEB METHOD, COM O SEGUINTE RETORNO
// [WebMethod]
// public static object GetListEstado(string knownCategoryValues, string contextKey)
// {
//   return new System.Web.UI.WebControls.ListItem[];
// }
$.fn.addItemsCascading = function (sucessFunction, errorFunction) {

  var item = this;

  for (i = 0; i < item.length; i++) {

    var contextKey = $(item[i]).attr('data-selected'); if (contextKey == null) contextKey = "";

    addSelectItemCascading(
        item[i],
        "",
        contextKey,
        function (args){ },
        errorFunction );


    }

};

function onChangeSelect(item, autochange){

  if ( $(item).attr('onchange') && autochange )
  {
    return;
  }
  var kcv = $(item).attr("data-category");
  if ( kcv != null ){
    kcv += ":" + $(item).val() + ";";

    if ( $(item).attr("data-knowcategory") != null && $(item).attr("data-knowcategory") != "" )
    {
      kcv = kcv + $(item).attr("data-knowcategory");
    }

    //kcv +=  $(item).find('option:selected').attr('data-category') + ":" + $(item).val() + ";"

    var lista = $("*").find("[data-parentid = '" + $(item).attr("id") + "']")
    for (var i = 0; i < lista.length; i++) {
      var contextKey = $(lista[i]).attr('data-selected'); if (contextKey == null) contextKey = "";
      addSelectItemCascading( lista[i], kcv, contextKey, function(args){}, function(args){} );
    }
  }
}

//ATUALIZA TODAS AS DROPDOWNS FILHAS
$(function (){
  $('select').change( function(){ onChangeSelect(this, true); } );
});



////****************************************************************************
////INTERNAS
////****************************************************************************

//OBJETO DE RETORNO DEVE SER UM ARRAY COM OS ATRIBUTOS:
// string Value
// string Text
// string Selected
function addItensSuccess (item, lista) {
  var html = "";

  var showFirstOption =  $(item).attr("data-showfirstoption");
  if (showFirstOption != null && showFirstOption != "" ){
    if ( showFirstOption != "false" )
    {
      html = "<option value=''>" + showFirstOption + "</option>";
    }
  }
  else{
    html = "<option value=''>" + "Selecione..." + "</option>";
  }

  if (lista.length == 0){
    $(item).html("").trigger('change');
    return;
  }
  var selectedValue = "";
  for (var i = 0; i < lista.length; i++) {

    html += "<option value='" + lista[i].Value + "'";

    if (lista[i].Selected)
    {
      selectedValue = lista[i].Text;
      html += " selected = 'true'";
    }
    if (lista[i].Title != ""){
      html += " title='" + lista[i].Title + "'";
    }

    html += " data-category='" + lista[i].Category +"' >" + lista[i].Text + "</option>";
  };

  $(item).html(html)
       .attr("disabled", false)
       .trigger('change');
};

//FUNÇãO PARA ADICIONAR ITENS EM UMA DROPDOWN ORIUNDOS DE UM WEBMETHOD
function addSelectItem(item, parameters, sucessFunction, errorFunction){

  $(item).attr("disabled", true)
         .html("<option value=''>Carregando...</option>");

  //pega nome do metodo
  var methodName = $(item).attr('data-method');

  //se não informou metodo, já para por aqui
  if ( methodName == null || methodName == "" )
  {
    $(item).html("<option value=''>[ERRO 001]: Não foi definido o atributo 'data-method'</option>").trigger('change');
    return;
  }

  if (parameters == null || parameters == ""){ parameters = "{}";}

  //se tem algum item de filtro ainda não definido, não chama o serviço.
  if (parameters.indexOf(":;") > 0 )
  {
    $(item).html("").trigger('change');
    return;
  }

  executeWebMethod(methodName, parameters,
    function (args){
      addItensSuccess(item, args);
      if(sucessFunction != null) sucessFunction(args);
    },
    function (args) {
      if(errorFunction != null) errorFunction(args);
    });
};

//ADICIONA ITENS EM UMA DROPDOWN COM CASCADING ORIUNDOS DE UM WEBMETHOD
function addSelectItemCascading(item, knownCategoryValues, contextKey, sucessFunction, errorFunction){

  //se tem parente nao preenche agora, espera o comando vir dele
  var parentId = $(item).attr('data-parentid');
  if ( parentId != null && parentId != "" ){

    if ( $("#" + parentId).attr("id") == null  )
    {
      $(item).html("<option value=''>[ERRO 002]: o parente '" + parentId + " não existe</option>");
      return;
    }
    else if (knownCategoryValues == null || knownCategoryValues == "" ){
      return;
    }
    else{
      $(item).attr("data-knowcategory", knownCategoryValues );
    }
  }
  var parameters = "{ knownCategoryValues:'" + knownCategoryValues + "' , contextKey: '" + contextKey + "', me:'"+ $(item).attr('id') +"'  }"

  addSelectItem( item, parameters, sucessFunction, errorFunction );
};
