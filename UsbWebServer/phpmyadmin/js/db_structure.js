AJAX.registerTeardown("db_structure.js",function(){$("span.fkc_switch").unbind("click");$("#fkc_checkbox").unbind("change");$("a.truncate_table_anchor.ajax").die("click");$("a.drop_table_anchor.ajax").die("click");$("a.drop_tracking_anchor.ajax").die("click");$("#real_end_input").die("click")});function PMA_adjustTotals(){var a=new Array(PMA_messages.strB,PMA_messages.strKiB,PMA_messages.strMiB,PMA_messages.strGiB,PMA_messages.strTiB,PMA_messages.strPiB,PMA_messages.strEiB);var g=$("#tablesForm table.data tbody:first tr");var h=g.size();var d=0;var c=0;var f=0;var l=false;g.each(function(){var u=$(this);var r=u.find(".tbl_rows").text();if(r.indexOf("~")==0){l=true;r=r.substring(1,r.length-1)}r=r.replace(/[,.]/g,"");var p=parseInt(r,10);if(!isNaN(p)){d+=p}var w=0;var n=0;var s=$.trim(u.find(".tbl_size span:not(.unit)").text());var v=$.trim(u.find(".tbl_size span.unit").text());var t=$.trim(u.find(".tbl_overhead span:not(.unit)").text());var q=$.trim(u.find(".tbl_overhead span.unit").text());for(var o=0;o<a.length;o++){if(v==a[o]){var m=parseFloat(s);w=m*Math.pow(1024,o);break}}for(var o=0;o<a.length;o++){if(q==a[o]){var m=parseFloat(t);n=m*Math.pow(1024,o);break}}c+=w;f+=n});var k=d+"";var j=/(\d+)(\d{3})/;while(j.test(k)){k=k.replace(j,"$1,$2")}if(l){k="~"+k}var e=0,i=0;while(c>=1024){c/=1024;e++}while(f>=1024){f/=1024;i++}c=Math.round(c*10)/10;f=Math.round(f*10)/10;var b=$("#tbl_summary_row");b.find(".tbl_num").text($.sprintf(PMA_messages.strTables,h));b.find(".tbl_rows").text(k);b.find(".tbl_size").text(c+" "+a[e]);b.find(".tbl_overhead").text(f+" "+a[i])}AJAX.registerOnload("db_structure.js",function(){$("#tablesForm").submit(function(b){var a=$(this);if(a.find("select[name=submit_mult]").val()==="print"){b.preventDefault();b.stopPropagation();$("form#clone").remove();var c=a.clone().hide().appendTo("body");c.find("select[name=submit_mult]").val("print");c.attr("target","printview").attr("id","clone").submit()}});$("span.fkc_switch").click(function(a){if($("#fkc_checkbox").prop("checked")){$("#fkc_checkbox").prop("checked",false);$("#fkc_status").html(PMA_messages.strForeignKeyCheckDisabled);return}$("#fkc_checkbox").prop("checked",true);$("#fkc_status").html(PMA_messages.strForeignKeyCheckEnabled)});$("#fkc_checkbox").change(function(){if($(this).prop("checked")){$("#fkc_status").html(PMA_messages.strForeignKeyCheckEnabled);return}$("#fkc_status").html(PMA_messages.strForeignKeyCheckDisabled)});$("a.truncate_table_anchor.ajax").live("click",function(c){c.preventDefault();var b=$(this);var d=b.parents("tr").children("th").children("a").text();var a=PMA_messages.strTruncateTableStrongWarning+" "+$.sprintf(PMA_messages.strDoYouReally,"TRUNCATE "+escapeHtml(d));b.PMA_confirm(a,b.attr("href"),function(e){PMA_ajaxShowMessage(PMA_messages.strProcessingRequest);$.get(e,{is_js_confirmed:1,ajax_request:true},function(h){if(h.success==true){PMA_ajaxShowMessage(h.message);var g=b.closest("tr");g.find(".tbl_rows").text("0");g.find(".tbl_size, .tbl_overhead").text("-");var f=b.html().replace(/b_empty/,"bd_empty");b.replaceWith(f).removeClass("truncate_table_anchor");PMA_adjustTotals()}else{PMA_ajaxShowMessage(PMA_messages.strErrorProcessingRequest+" : "+h.error,false)}})})});$("a.drop_table_anchor.ajax").live("click",function(e){e.preventDefault();var d=$(this);var b=d.parents("tr");var f=b.children("th").children("a").text();var c=b.hasClass("is_view")||d.hasClass("view");var a;if(!c){a=PMA_messages.strDropTableStrongWarning+" "+$.sprintf(PMA_messages.strDoYouReally,"DROP TABLE "+escapeHtml(f))}else{a=$.sprintf(PMA_messages.strDoYouReally,"DROP VIEW "+escapeHtml(f))}d.PMA_confirm(a,d.attr("href"),function(h){var g=PMA_ajaxShowMessage(PMA_messages.strProcessingRequest);$.get(h,{is_js_confirmed:1,ajax_request:true},function(i){if(i.success==true){PMA_ajaxShowMessage(i.message);toggleRowColors(b.next());b.hide("medium").remove();PMA_adjustTotals();PMA_reloadNavigation();PMA_ajaxRemoveMessage(g)}else{PMA_ajaxShowMessage(PMA_messages.strErrorProcessingRequest+" : "+i.error,false)}})})});$("a.drop_tracking_anchor.ajax").live("click",function(c){c.preventDefault();var b=$(this);var d=b.parents("tr");var a=PMA_messages.strDeleteTrackingData;b.PMA_confirm(a,b.attr("href"),function(e){PMA_ajaxShowMessage(PMA_messages.strDeletingTrackingData);$.get(e,{is_js_confirmed:1,ajax_request:true},function(j){if(j.success==true){var i=d.parents("table");var f=d.find("td:nth-child(2)").text();if(i.find("tbody tr").length===1){$("#tracked_tables").hide("slow").remove()}else{toggleRowColors(d.next());d.hide("slow",function(){$(this).remove()})}var h=$("table#noversions");if(h.length>0){var g=h.find("tbody tr");g.each(function(m){var k=$(this);var p=k.find("td:first-child").text();var n=(m==(g.length-1));if(p>f||n){var l=k.clone();l.find("td:first-child").text(f);var o=l.find("td:nth-child(2) a").attr("href").replace("table="+p,"table="+encodeURIComponent(f));l.find("td:nth-child(2) a").attr("href",o);if(p>f){l.insertBefore(k);toggleRowColors(k);return false}else{l.insertAfter(k);toggleRowColors(l)}}})}PMA_ajaxShowMessage(j.message)}else{PMA_ajaxShowMessage(PMA_messages.strErrorProcessingRequest+" : "+j.error,false)}})})});$("#real_end_input").live("click",function(b){b.preventDefault();var a=PMA_messages.strOperationTakesLongTime;$(this).PMA_confirm(a,"",function(){return true});return false})});