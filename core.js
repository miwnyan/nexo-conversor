(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NexoCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const definitions={
  currency:{label:'Moedas',items:{BRL:'Real brasileiro',USD:'Dólar americano',EUR:'Euro',GBP:'Libra esterlina',JPY:'Iene japonês',CAD:'Dólar canadense'}},
  length:{label:'Comprimento',items:{m:'Metro',km:'Quilômetro',cm:'Centímetro',mm:'Milímetro',mi:'Milha',ft:'Pé'}},
  mass:{label:'Massa',items:{kg:'Quilograma',g:'Grama',mg:'Miligrama',lb:'Libra',oz:'Onça'}},
  temperature:{label:'Temperatura',items:{C:'Celsius',F:'Fahrenheit',K:'Kelvin'}}
 };
 const length={m:1,km:1000,cm:.01,mm:.001,mi:1609.344,ft:.3048};
 const mass={kg:1,g:.001,mg:.000001,lb:.45359237,oz:.028349523125};
 function validateAmount(raw,category){if(String(raw).trim()==='')throw Error('Informe um valor.');const n=Number(raw);if(!Number.isFinite(n)||Math.abs(n)>1e12)throw Error('Informe um número válido (até 1 trilhão).');if(category!=='temperature'&&n<0)throw Error('Utilize um valor maior ou igual a zero.');return n;}
 function convert(value,category,from,to){if(!definitions[category]||!Object.hasOwn(definitions[category].items,from)||!Object.hasOwn(definitions[category].items,to))throw Error('Unidades inválidas.');if(category==='currency')throw Error('Conversão de moeda exige cotação.');const v=validateAmount(value,category);
  if(category==='temperature'&&(from==='K'&&v<0||from==='C'&&v< -273.15||from==='F'&&v< -459.67))throw Error('Temperatura abaixo do zero absoluto.');
  if(from===to)return v;
  if(category==='temperature'){const kelvin=from==='C'?v+273.15:from==='F'?(v+459.67)*5/9:v;if(kelvin<0)throw Error('Temperatura abaixo do zero absoluto.');return to==='K'?kelvin:to==='C'?kelvin-273.15:kelvin*9/5-459.67;}
  const factors=category==='length'?length:mass;return v*factors[from]/factors[to];}
 function currency(value,rate){const n=validateAmount(value,'currency');if(!Number.isFinite(rate)||rate<=0)throw Error('Cotação inválida.');return n*rate;}
 function format(value,category){if(!Number.isFinite(value))return '—';return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:category==='currency'?4:6}).format(value);}
 function addHistory(items,entry){return [entry,...items].slice(0,12);}
 return {definitions,validateAmount,convert,currency,format,addHistory};
});
