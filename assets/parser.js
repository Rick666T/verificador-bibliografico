(function(root,factory){const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.ReferenceParser=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const cleanLine=s=>s.replace(/[\u00ad\u200b]/g,"").replace(/\u00a0/g," ").replace(/\s+/g," ").trim();
  const stripMarker=s=>s.replace(/^\s*(?:\[?\d{1,4}[.)\]]|[•▪◦])\s+/,"").trim();
  const numbered=s=>/^\s*(?:\[?\d{1,4}[.)\]]|[•▪◦])\s+/.test(s);
  const authorYear=s=>/^(?:[A-ZÁÉÍÓÚÑÜ][\p{L}'’.-]+|[A-ZÁÉÍÓÚÑÜ][\p{L}'’.-]+,|[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s&.-]{2,})[\s\S]{0,180}(?:\(|,\s*)(?:1[5-9]\d{2}|20\d{2}|21\d{2}|s\.\s*f\.)/iu.test(s);
  function parseBibTeX(text){const out=[];let start=-1,depth=0;for(let i=0;i<text.length;i++){if(text[i]==="@"&&depth===0)start=i;if(start>=0&&text[i]==="{")depth++;else if(start>=0&&text[i]==="}"){depth--;if(depth===0){out.push(cleanLine(text.slice(start,i+1)));start=-1}}}return out;}
  function parseRis(text){return text.split(/\nER\s+-?\s*(?:\n|$)/i).map(cleanLine).filter(x=>/^TY\s+-/i.test(x));}
  function analyze(raw){
    const clean=String(raw||"").replace(/\r/g,"").trim();
    if(!clean)return{references:[],method:"empty",certainty:"high",message:"Pega la bibliografía para comenzar."};
    if(/^TY\s+-/m.test(clean)){const references=parseRis(clean);return{references,method:"ris",certainty:"high",message:`${references.length} registros RIS identificados.`};}
    if(/^@\w+\s*\{/m.test(clean)){const references=parseBibTeX(clean);return{references,method:"bibtex",certainty:"high",message:`${references.length} registros BibTeX identificados.`};}
    const paragraphs=clean.split(/\n\s*\n+/).map(x=>cleanLine(x)).filter(Boolean);
    if(paragraphs.length>1)return{references:paragraphs.map(stripMarker),method:"paragraphs",certainty:"high",message:"Separación reconocida por párrafos."};
    const lines=clean.split("\n").map(x=>x.trim()).filter(Boolean);
    if(lines.length===1)return{references:[stripMarker(cleanLine(lines[0]))],method:"single",certainty:"medium",message:"Se identificó una referencia."};
    const starts=lines.map((line,i)=>({i,isStart:numbered(line)||authorYear(stripMarker(line))})).filter(x=>x.isStart);
    if(starts.length>=2){const references=[];let current="";for(const line of lines){const isStart=numbered(line)||authorYear(stripMarker(line));if(isStart&&current){references.push(cleanLine(current));current=""}current+=(current?" ":"")+stripMarker(line)}if(current)references.push(cleanLine(current));return{references,method:"smart-lines",certainty:"high",message:"La herramienta unió automáticamente las líneas que pertenecen a una misma referencia."};}
    const looksLikeSeparate=lines.filter(x=>/[.!?]$/.test(x)&&x.length>35).length/lines.length>=.75;
    if(looksLikeSeparate)return{references:lines.map(x=>stripMarker(cleanLine(x))),method:"lines",certainty:"medium",message:"Se interpretó cada línea como una referencia. Revisa que el total sea correcto."};
    return{references:[cleanLine(clean)],method:"ambiguous",certainty:"low",message:"No fue posible reconocer con seguridad dónde termina cada referencia. Agrega una línea en blanco entre ellas."};
  }
  return{analyze,parse:text=>analyze(text).references};
});
