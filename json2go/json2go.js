; (function () {
    var globalArr = [];
    var globalMapArr = [];
    var global2MapArr = [];
    var globalMarshalJSON = [];

    function formatKey(str) {
        if (!str)
            return "";
        else if (str.match(/^\d+$/))
            str = "Num" + str;
        else if (str.charAt(0).match(/\d/)) {
            const numbers = {
                '0': "Zero_", '1': "One_", '2': "Two_", '3': "Three_",
                '4': "Four_", '5': "Five_", '6': "Six_", '7': "Seven_",
                '8': "Eight_", '9': "Nine_"
            };
            str = numbers[str.charAt(0)] + str.substr(1);
        }
        return toProperCase(str).replace(/[^a-z0-9]/ig, "") || "NAMING_FAILED";
    }

    function toProperCase(str) {
        // ensure that the SCREAMING_SNAKE_CASE is converted to snake_case
        if (str.match(/^[_A-Z0-9]+$/)) {
            str = str.toLowerCase();
        }

        // https://github.com/golang/lint/blob/5614ed5bae6fb75893070bdc0996a68765fdd275/lint.go#L771-L810
        const commonInitialisms = [
            "ACL", "API", "ASCII", "CPU", "CSS", "DNS", "EOF", "GUID", "HTML", "HTTP",
            "HTTPS", "ID", "IP", "JSON", "LHS", "QPS", "RAM", "RHS", "RPC", "SLA",
            "SMTP", "SQL", "SSH", "TCP", "TLS", "TTL", "UDP", "UI", "UID", "UUID",
            "URI", "URL", "UTF8", "VM", "XML", "XMPP", "XSRF", "XSS"
        ];

        return str.replace(/(^|[^a-zA-Z])([a-z]+)/g, function (unused, sep, frag) {
            if (commonInitialisms.indexOf(frag.toUpperCase()) >= 0)
                return sep + frag.toUpperCase();
            else
                return sep + frag[0].toUpperCase() + frag.substr(1).toLowerCase();
        }).replace(/([A-Z])([a-z]+)/g, function (unused, sep, frag) {
            if (commonInitialisms.indexOf(sep + frag.toUpperCase()) >= 0)
                return (sep + frag).toUpperCase();
            else
                return sep + frag;
        });
    }

    function covert(json, currentKey, depth) {
        var arr = [`type ${formatKey(currentKey)} struct {`];
        var mapArr = [`func New${formatKey(currentKey)}FromMap(data map[string]interface{}) (result ${formatKey(currentKey)}) {`];
        var toMapArr = [`func (result *${formatKey(currentKey)}) ToMap() (data map[string]interface{}) {
  data = make(map[string]interface{}, ${Object.keys(json).length})`];
        var MarshalJSON = [`func (result *${formatKey(currentKey)}) MarshalJSON() (dst []byte, e error) {
  var bd bytes.Buffer
  bd.WriteByte('{')`];
        for (const key in json) {
            switch (typeof json[key]) {
                case 'string':
                    arr.push(`  ${formatKey(key)} string \`json:"${key}"\``);
                    mapArr.push(`  result.${formatKey(key)} = data["${key}"].(string)`);
                    toMapArr.push(`  data["${key}"] = result.${formatKey(key)}`);
                    MarshalJSON.push(`  bd.WriteString(fmt.Sprintf(\`${MarshalJSON.length > 1 ? ',' : ''}"${key}": "%v"\`, result.${formatKey(key)}))`)
                    break;
                case 'boolean':
                    arr.push(`  ${formatKey(key)} bool \`json:"${key}"\``);
                    mapArr.push(`  result.${formatKey(key)} = data["${key}"].(bool)`);
                    toMapArr.push(`  data["${key}"] = result.${formatKey(key)}`);
                    MarshalJSON.push(`  bd.WriteString(fmt.Sprintf(\`${MarshalJSON.length > 1 ? ',' : ''}"${key}": %v\`, result.${formatKey(key)}))`)
                    break;
                case 'number':
                    arr.push(`  ${formatKey(key)} float64 \`json:"${key}"\``);
                    mapArr.push(`  result.${formatKey(key)} = data["${key}"].(float64)`);
                    toMapArr.push(`  data["${key}"] = result.${formatKey(key)}`);
                    MarshalJSON.push(`  bd.WriteString(fmt.Sprintf(\`${MarshalJSON.length > 1 ? ',' : ''}"${key}": %v\`, result.${formatKey(key)}))`)
                    break;
                case 'object':
                    if (!json[key]) {
                        arr.push(`  ${formatKey(key)} interface{} \`json:"${key}"\``);
                        toMapArr.push(`  data["${key}"] = result.${formatKey(key)}`);
                        MarshalJSON.push(`  bd.WriteString(fmt.Sprintf(\`${MarshalJSON.length > 1 ? ',' : ''}"${key}": %v\`, result.${formatKey(key)}))`)
                        break;
                    }
                    if (!(json[key] instanceof Array)) {
                        arr.push(`  ${formatKey(key)} ${formatKey(currentKey + '_' + key)} \`json:"${key}"\``);
                        mapArr.push(`  result.${formatKey(key)} = New${formatKey(currentKey + '_' + key)}FromMap(data["${key}"].(map[string]interface{}))`);
                        toMapArr.push(`  data["${key}"] = result.${formatKey(key)}.ToMap()`);
                        MarshalJSON.push(`  v${formatKey(key)}, _ := result.${formatKey(key)}.MarshalJSON()
  bd.WriteString(\`${MarshalJSON.length > 1 ? ',' : ''}"${key}": \`)
  bd.Write(v${formatKey(key)})`)
                        covert(json[key], formatKey(currentKey + '_' + key), depth++)
                        break;
                    }

                    var tp = typeof json[key][0];
                    if (tp == 'string') {
                        arr.push(`  ${formatKey(key)} []string \`json:"${key}"\``);
                        mapArr.push(`  for _, v := range data["${key}"].([]interface{}) {
    result.${formatKey(key)} = append(result.${formatKey(key)}, v.(string))
  }`);
                        toMapArr.push(`  arr${formatKey(key)} := make([]interface{}, len(result.${formatKey(key)}))
  for k := range result.${formatKey(key)} {
    arr${key}[k] = result.${formatKey(key)}[k]
  }
  data["${key}"] = arr${formatKey(key)}`);
                        MarshalJSON.push(`  bd.WriteString(\`${MarshalJSON.length > 1 ? ',' : ''}"${key}": \`)
  bd.WriteByte('[')
  for k := range result.${formatKey(key)} {
    bd.WriteString(\`,"\` + result.${formatKey(key)}[k] + \`"\`)
  }
  bd.WriteByte(']')`);
                        break;
                    } else if (tp == 'boolean') {
                        arr.push(`  ${formatKey(key)} []bool \`json:"${key}"\``);
                        mapArr.push(`  for k, v := range data["${key}"].([]interface{}) {
    result.${formatKey(key)} = append(result.${formatKey(key)}, v.(bool))
  }`);
                        toMapArr.push(`  data["${key}"] = make([]interface{}, len(result.${formatKey(key)}))
  for k := range result.${formatKey(key)} {
    data["${key}"][k] = result.${formatKey(key)}[k]
  }`);
                        MarshalJSON.push(`  bd.WriteString(\`${MarshalJSON.length > 1 ? ',' : ''}"${key}": \`)
  bd.WriteByte('[')
  for k := range result.${formatKey(key)} {
    bd.WriteString(fmt.Sprintf(\`,%v\`, result.${formatKey(key)}[k]))
  }
  bd.WriteByte(']')`);
                        break;
                    } else if (tp == 'number') {
                        arr.push(`  ${formatKey(key)} []float64 \`json:"${key}"\``);
                        mapArr.push(`  for _, v := range data["${key}"].([]interface{}) {
    result.${formatKey(key)} = append(result.${formatKey(key)}, v.(float64))
}`);
                        toMapArr.push(`  arr${formatKey(key)} := make([]interface{}, len(result.${formatKey(key)}))
  for k := range result.${formatKey(key)} {
    arr${formatKey(key)}[k] = result.${formatKey(key)}[k]
  }
  data["${key}"] = arr${formatKey(key)}`);
                        MarshalJSON.push(`  bd.WriteString(\`${MarshalJSON.length > 1 ? ',' : ''}"${key}": \`)
  bd.WriteByte('[')
  for k := range result.${formatKey(key)} {
    bd.WriteString(fmt.Sprintf(\`,%v\`, result.${formatKey(key)}[k]))
  }
  bd.WriteByte(']')`);
                        break;
                    } else if (tp == 'object' && !(json[key][0] instanceof Array)) {
                        arr.push(`  ${formatKey(key)} []${formatKey(key)} \`json:"${key}"\``);
                        mapArr.push(`  for _, v := range data["${key}"].([]interface{}) {
    result.${formatKey(key)} = append(result.${formatKey(key)}, New${key}FromMap(v.(map[string]interface{})))
  }`);
                        toMapArr.push(`  arr${formatKey(key)} := make([]interface{}, len(result.${formatKey(key)}))
  for k := range result.${formatKey(key)} {
    arr${formatKey(key)}[k] = result.${formatKey(key)}[k].ToMap()
  }
  data["${key}"] = arr${formatKey(key)}`);
                        MarshalJSON.push(`  bd.WriteString(\`${MarshalJSON.length > 1 ? ',' : ''}"${key}": \`)
  bd.WriteByte('[')
  for k := range result.${formatKey(key)} {
    bt, _ := result.${formatKey(key)}[k].MarshalJSON()
    if k > 0 {
        bd.WriteByte(',')
    }
    bd.Write(bt)
  }
  bd.WriteByte(']')`);
                        covert(json[key][0], key, depth++)
                        break;
                    }
                    break;
                default:
                    break;
            }
        }

        function covertArray() {

        }

        arr.push('}')
        mapArr.push(`  return
}`);
        toMapArr.push(`  return
}`);
        MarshalJSON.push(`  bd.WriteByte('}')
  dst = bd.Bytes()
  return
}`)

        globalMarshalJSON.unshift(MarshalJSON);
        global2MapArr.unshift(toMapArr);
        globalMapArr.unshift(mapArr);
        globalArr.unshift(arr);

        return;
    }

    window.json2go = json2go;
    function json2go(...args) {
        covert(...args);
        var opts = {
            tomap: false,
            newmap: false,
            marshal: false,
        }
        if (args[3]) {
            opts = { ...opts, ...args[3] }
        }
        var str = [globalArr.map(v => v.join('\r\n')).join('\r\n\r\n')];
        if (opts.tomap) str.push(global2MapArr.map(v => v.join('\r\n')).join('\r\n\r\n'))
        if (opts.marshal) str.push(globalMarshalJSON.map(v => v.join('\r\n')).join('\r\n\r\n'))
        if (opts.newmap) str.push(globalMapArr.map(v => v.join('\r\n')).join('\r\n\r\n'))

        globalArr = [];
        globalMapArr = [];
        global2MapArr = [];
        globalMarshalJSON = [];
        return str.join('\r\n\r\n');
    };
})();
