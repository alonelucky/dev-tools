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
