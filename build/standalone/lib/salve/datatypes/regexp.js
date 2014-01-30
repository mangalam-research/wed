define(function (require) {
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"start":3,"input":4,"EOF":5,"regexp":6,"branch":7,"|":8,"piece":9,"atom":10,"quantifier":11,"?":12,"*":13,"+":14,"{":15,"quantity":16,"}":17,"NUMBER":18,",":19,"CHAR":20,"charClass":21,"(":22,")":23,"charClassEsc":24,"charClassExpr":25,"WILDCARDESC":26,"charClassExprStart":27,"charGroup":28,"]":29,"[":30,"[^":31,"posCharGroups":32,"charClassSub":33,"posCharGroup":34,"charRange":35,"CLASSSUBTRACTION":36,"seRange":37,"-":38,"charOrEsc":39,"XMLCHAR":40,"SingleCharEsc":41,"SINGLECHARESC":42,"MULTICHARESC":43,"CATESC":44,"COMPLESC":45,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"|",12:"?",13:"*",14:"+",15:"{",17:"}",18:"NUMBER",19:",",20:"CHAR",22:"(",23:")",26:"WILDCARDESC",29:"]",30:"[",31:"[^",36:"CLASSSUBTRACTION",38:"-",40:"XMLCHAR",41:"SingleCharEsc",42:"SINGLECHARESC",43:"MULTICHARESC",44:"CATESC",45:"COMPLESC"},
productions_: [0,[3,1],[4,1],[4,2],[6,1],[6,3],[7,1],[7,2],[9,1],[9,2],[11,1],[11,1],[11,1],[11,3],[16,1],[16,3],[16,2],[10,1],[10,1],[10,3],[21,1],[21,1],[21,1],[25,3],[27,1],[27,1],[28,1],[28,1],[32,1],[32,2],[34,1],[34,1],[33,3],[35,1],[35,1],[37,3],[37,1],[39,1],[39,1],[24,1],[24,1],[24,1],[24,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */, output_type) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
        // Overwrite the parseError method with our own. NOTE: Our own
        // method does not allow recovering from recoverable parsing
        // errors.
        this.parseError = parseError;
        output_type = output_type || "re";
        switch(output_type) {
        case "string":
            return $$[$0];
        case "re":
            var constructor = (needs_xregexp ? XRegExp : RegExp);
            return new constructor($$[$0]);
        default:
            throw new Error("unsupported output type: " + output_type);
        }
    
break;
case 2:this.$ = '^$';
break;
case 3:this.$ = '^' + $$[$0-1] + '$';
break;
case 5:this.$ = $$[$0-2].concat($$[$0-1], $$[$0]);
break;
case 7:this.$ = $$[$0-1] + $$[$0];
break;
case 9:this.$ = $$[$0-1] + $$[$0];
break;
case 13:this.$ = $$[$0-2].concat($$[$0-1], $$[$0]);
break;
case 15:this.$ = $$[$0-2].concat(',', $$[$0]);
break;
case 16:this.$ = $$[$0-1].concat($$[$0]);
break;
case 19:this.$ = '(?:' + $$[$0-1] + $$[$0];
break;
case 23:
            var state = group_state.shift();
            var captured_multi_char =
                    state.captured_multi_char;

            var subtraction = state.subtraction ?
                    ("(?!" +  state.subtraction + ")") : "";
            if (captured_multi_char.length !== 0) {
                var out = ["(?:", subtraction];
                if (state.negative) {
                    out.push("(?=[");
                    for(var i = 0; i < captured_multi_char.length; ++i)
                        out.push(multi_char_escapes_in_group[
                            captured_multi_char[i]].slice(1));
                    out.push("])");
                }
                else {
                    for(var i = 0; i < captured_multi_char.length; ++i)
                        out.push("[",
                                 multi_char_escapes_in_group[
                                     captured_multi_char[i]],
                                 "]|");
                }
                out.push($$[$0-2], $$[$0-1], $$[$0], ")");
                this.$ = out.join("");
            }
            else
                this.$ = (subtraction !== "") ?
                   "(?:" + subtraction + $$[$0-2].concat($$[$0-1], $$[$0]) + ")":
                   $$[$0-2].concat($$[$0-1], $$[$0]);
        
break;
case 24:
            unshift_group_state(false);
            this.$ = $$[$0];
        
break;
case 25:
            unshift_group_state(true);
            this.$ = $$[$0];
        
break;
case 29:this.$ = $$[$0-1] + $$[$0];
break;
case 32:
            this.$ = $$[$0-2];
            group_state[0].subtraction = $$[$0];
        
break;
case 35:this.$ = $$[$0-2].concat($$[$0-1], $$[$0]);
break;
case 40:
        if (group_state.length) {
            var repl = multi_char_escapes_in_group[$$[$0]]
            if (repl.charAt(0) === "^") {
                group_state[0].captured_multi_char.push($$[$0]);
                this.$ = "";
            }
            else
                this.$ = repl;
        }
        else
            this.$ = multi_char_escapes[$$[$0]]
    
break;
case 41:
        needs_xregexp = true;
        this.$ = $$[$0];
    
break;
case 42:
        needs_xregexp = true;
        this.$ = $$[$0];
    
break;
}
},
table: [{3:1,4:2,5:[1,3],6:4,7:5,9:6,10:7,20:[1,8],21:9,22:[1,10],24:11,25:12,26:[1,13],27:18,30:[1,19],31:[1,20],42:[1,14],43:[1,15],44:[1,16],45:[1,17]},{1:[3]},{1:[2,1]},{1:[2,2]},{5:[1,21]},{5:[2,4],8:[1,22],9:23,10:7,20:[1,8],21:9,22:[1,10],23:[2,4],24:11,25:12,26:[1,13],27:18,30:[1,19],31:[1,20],42:[1,14],43:[1,15],44:[1,16],45:[1,17]},{5:[2,6],8:[2,6],20:[2,6],22:[2,6],23:[2,6],26:[2,6],30:[2,6],31:[2,6],42:[2,6],43:[2,6],44:[2,6],45:[2,6]},{5:[2,8],8:[2,8],11:24,12:[1,25],13:[1,26],14:[1,27],15:[1,28],20:[2,8],22:[2,8],23:[2,8],26:[2,8],30:[2,8],31:[2,8],42:[2,8],43:[2,8],44:[2,8],45:[2,8]},{5:[2,17],8:[2,17],12:[2,17],13:[2,17],14:[2,17],15:[2,17],20:[2,17],22:[2,17],23:[2,17],26:[2,17],30:[2,17],31:[2,17],42:[2,17],43:[2,17],44:[2,17],45:[2,17]},{5:[2,18],8:[2,18],12:[2,18],13:[2,18],14:[2,18],15:[2,18],20:[2,18],22:[2,18],23:[2,18],26:[2,18],30:[2,18],31:[2,18],42:[2,18],43:[2,18],44:[2,18],45:[2,18]},{6:29,7:5,9:6,10:7,20:[1,8],21:9,22:[1,10],24:11,25:12,26:[1,13],27:18,30:[1,19],31:[1,20],42:[1,14],43:[1,15],44:[1,16],45:[1,17]},{5:[2,20],8:[2,20],12:[2,20],13:[2,20],14:[2,20],15:[2,20],20:[2,20],22:[2,20],23:[2,20],26:[2,20],30:[2,20],31:[2,20],42:[2,20],43:[2,20],44:[2,20],45:[2,20]},{5:[2,21],8:[2,21],12:[2,21],13:[2,21],14:[2,21],15:[2,21],20:[2,21],22:[2,21],23:[2,21],26:[2,21],30:[2,21],31:[2,21],42:[2,21],43:[2,21],44:[2,21],45:[2,21]},{5:[2,22],8:[2,22],12:[2,22],13:[2,22],14:[2,22],15:[2,22],20:[2,22],22:[2,22],23:[2,22],26:[2,22],30:[2,22],31:[2,22],42:[2,22],43:[2,22],44:[2,22],45:[2,22]},{5:[2,39],8:[2,39],12:[2,39],13:[2,39],14:[2,39],15:[2,39],20:[2,39],22:[2,39],23:[2,39],26:[2,39],29:[2,39],30:[2,39],31:[2,39],36:[2,39],38:[2,39],40:[2,39],41:[2,39],42:[2,39],43:[2,39],44:[2,39],45:[2,39]},{5:[2,40],8:[2,40],12:[2,40],13:[2,40],14:[2,40],15:[2,40],20:[2,40],22:[2,40],23:[2,40],26:[2,40],29:[2,40],30:[2,40],31:[2,40],36:[2,40],38:[2,40],40:[2,40],41:[2,40],42:[2,40],43:[2,40],44:[2,40],45:[2,40]},{5:[2,41],8:[2,41],12:[2,41],13:[2,41],14:[2,41],15:[2,41],20:[2,41],22:[2,41],23:[2,41],26:[2,41],29:[2,41],30:[2,41],31:[2,41],36:[2,41],38:[2,41],40:[2,41],41:[2,41],42:[2,41],43:[2,41],44:[2,41],45:[2,41]},{5:[2,42],8:[2,42],12:[2,42],13:[2,42],14:[2,42],15:[2,42],20:[2,42],22:[2,42],23:[2,42],26:[2,42],29:[2,42],30:[2,42],31:[2,42],36:[2,42],38:[2,42],40:[2,42],41:[2,42],42:[2,42],43:[2,42],44:[2,42],45:[2,42]},{24:34,28:30,32:31,33:32,34:33,35:35,37:36,38:[1,37],39:38,40:[1,39],41:[1,40],42:[1,14],43:[1,15],44:[1,16],45:[1,17]},{38:[2,24],40:[2,24],41:[2,24],42:[2,24],43:[2,24],44:[2,24],45:[2,24]},{38:[2,25],40:[2,25],41:[2,25],42:[2,25],43:[2,25],44:[2,25],45:[2,25]},{1:[2,3]},{6:41,7:5,9:6,10:7,20:[1,8],21:9,22:[1,10],24:11,25:12,26:[1,13],27:18,30:[1,19],31:[1,20],42:[1,14],43:[1,15],44:[1,16],45:[1,17]},{5:[2,7],8:[2,7],20:[2,7],22:[2,7],23:[2,7],26:[2,7],30:[2,7],31:[2,7],42:[2,7],43:[2,7],44:[2,7],45:[2,7]},{5:[2,9],8:[2,9],20:[2,9],22:[2,9],23:[2,9],26:[2,9],30:[2,9],31:[2,9],42:[2,9],43:[2,9],44:[2,9],45:[2,9]},{5:[2,10],8:[2,10],20:[2,10],22:[2,10],23:[2,10],26:[2,10],30:[2,10],31:[2,10],42:[2,10],43:[2,10],44:[2,10],45:[2,10]},{5:[2,11],8:[2,11],20:[2,11],22:[2,11],23:[2,11],26:[2,11],30:[2,11],31:[2,11],42:[2,11],43:[2,11],44:[2,11],45:[2,11]},{5:[2,12],8:[2,12],20:[2,12],22:[2,12],23:[2,12],26:[2,12],30:[2,12],31:[2,12],42:[2,12],43:[2,12],44:[2,12],45:[2,12]},{16:42,18:[1,43]},{23:[1,44]},{29:[1,45]},{24:34,29:[2,26],34:46,35:35,36:[1,47],37:36,38:[1,37],39:38,40:[1,39],41:[1,40],42:[1,14],43:[1,15],44:[1,16],45:[1,17]},{29:[2,27]},{29:[2,28],36:[2,28],38:[2,28],40:[2,28],41:[2,28],42:[2,28],43:[2,28],44:[2,28],45:[2,28]},{29:[2,30],36:[2,30],38:[2,30],40:[2,30],41:[2,30],42:[2,30],43:[2,30],44:[2,30],45:[2,30]},{29:[2,31],36:[2,31],38:[2,31],40:[2,31],41:[2,31],42:[2,31],43:[2,31],44:[2,31],45:[2,31]},{29:[2,33],36:[2,33],38:[2,33],40:[2,33],41:[2,33],42:[2,33],43:[2,33],44:[2,33],45:[2,33]},{29:[2,34],36:[2,34],38:[2,34],40:[2,34],41:[2,34],42:[2,34],43:[2,34],44:[2,34],45:[2,34]},{29:[2,36],36:[2,36],38:[1,48],40:[2,36],41:[2,36],42:[2,36],43:[2,36],44:[2,36],45:[2,36]},{29:[2,37],36:[2,37],38:[2,37],40:[2,37],41:[2,37],42:[2,37],43:[2,37],44:[2,37],45:[2,37]},{29:[2,38],36:[2,38],38:[2,38],40:[2,38],41:[2,38],42:[2,38],43:[2,38],44:[2,38],45:[2,38]},{5:[2,5],23:[2,5]},{17:[1,49]},{17:[2,14],19:[1,50]},{5:[2,19],8:[2,19],12:[2,19],13:[2,19],14:[2,19],15:[2,19],20:[2,19],22:[2,19],23:[2,19],26:[2,19],30:[2,19],31:[2,19],42:[2,19],43:[2,19],44:[2,19],45:[2,19]},{5:[2,23],8:[2,23],12:[2,23],13:[2,23],14:[2,23],15:[2,23],20:[2,23],22:[2,23],23:[2,23],26:[2,23],29:[2,23],30:[2,23],31:[2,23],42:[2,23],43:[2,23],44:[2,23],45:[2,23]},{29:[2,29],36:[2,29],38:[2,29],40:[2,29],41:[2,29],42:[2,29],43:[2,29],44:[2,29],45:[2,29]},{25:51,27:18,30:[1,19],31:[1,20]},{39:52,40:[1,39],41:[1,40]},{5:[2,13],8:[2,13],20:[2,13],22:[2,13],23:[2,13],26:[2,13],30:[2,13],31:[2,13],42:[2,13],43:[2,13],44:[2,13],45:[2,13]},{17:[2,16],18:[1,53]},{29:[2,32]},{29:[2,35],36:[2,35],38:[2,35],40:[2,35],41:[2,35],42:[2,35],43:[2,35],44:[2,35],45:[2,35]},{17:[2,15]}],
defaultActions: {2:[2,1],3:[2,2],21:[2,3],32:[2,27],51:[2,32],53:[2,15]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                this.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
var xmlcharacters = require("./xmlcharacters");
var XRegExp = require("xregexp").XRegExp;

// We use the name ``Salve`` to help avoid potential
// clashes. ``ParsingError`` seems too risky.
function SalveParsingError(msg) {
    // This is crap to work around the fact that Error is a terribly
    // designed class or prototype or whatever. Unfortunately the
    // stack trace contains an extra frame.
    var err = new Error(msg);
    this.name = "SalveParsingError";
    this.stack = err.stack;
    this.message = err.message;
}

SalveParsingError.prototype = new Error();

// This will serve as a replacement for the default parseError method on
// the parser.
function parseError(str, hash) {
    throw new SalveParsingError(str);
}

// Export this error.
if (typeof exports !== 'undefined')
    exports.SalveParsingError = SalveParsingError;
else
    parser.SalveParsingError = SalveParsingError;


var xml_Name_Char = xmlcharacters.xml_Name_Char;
var xml_Letter = xmlcharacters.xml_Letter;

// Maintain a group state.
var group_state = [];
var needs_xregexp = false;

function unshift_group_state(negative) {
     group_state.unshift({negative: negative,
                         captured_multi_char: []
                        });
}

var multi_char_escapes_in_group = {
    "\\s": " \\t\\n\\r",
    "\\S": "^ \\t\\n\\r",
    "\\i": "" + xml_Letter + "_:",
    "\\I": "^" + xml_Letter + "_:",
    "\\c": "" + xml_Name_Char,
    "\\C": "^" + xml_Name_Char,
    "\\d": "\\p{Nd}",
    "\\D": "^\\p{Nd}",
    "\\w": "^\\p{P}\\p{Z}\\p{C}",
    "\\W": "\\p{P}\\p{Z}\\p{C}"
};

var multi_char_escapes = [];
for(var i in multi_char_escapes_in_group) {
    if (!multi_char_escapes_in_group.hasOwnProperty(i))
       continue;
    multi_char_escapes[i] = "[" + multi_char_escapes_in_group[i] + "]";
}


/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 18;
break;
case 1:return 19;
break;
case 2:this.popState(); return 17;
break;
case 3:this.begin('CHARCLASS'); return 31;
break;
case 4:this.begin('CHARCLASS'); return 30;
break;
case 5:return 42;
break;
case 6:return 43;
break;
case 7:return 36;
break;
case 8:return 38;
break;
case 9:return 40;
break;
case 10:this.popState(); return 29;
break;
case 11:return 22;
break;
case 12:return 8;
break;
case 13:return 23;
break;
case 14:return 13;
break;
case 15:return 14;
break;
case 16:return 12;
break;
case 17:this.begin('QUANTITY'); return 15;
break;
case 18:return 17;
break;
case 19:return 29;
break;
case 20:return '^';
break;
case 21:return 44;
break;
case 22:return 45;
break;
case 23:return 26;
break;
case 24:return 5;
break;
case 25:return 20;
break;
}
},
rules: [/^(?:[0-9])/,/^(?:,)/,/^(?:\})/,/^(?:\[\^)/,/^(?:\[)/,/^(?:\\[-nrt\|.?*+(){}[\]^])/,/^(?:\\[sSiIcCdDwW])/,/^(?:-(?=\[))/,/^(?:-)/,/^(?:[^-[\]])/,/^(?:\])/,/^(?:\()/,/^(?:\|)/,/^(?:\))/,/^(?:\*)/,/^(?:\+)/,/^(?:\?)/,/^(?:\{)/,/^(?:\})/,/^(?:\])/,/^(?:\^)/,/^(?:\\p\{.*?\})/,/^(?:\\P\{.*?\})/,/^(?:\.)/,/^(?:$)/,/^(?:[^\\])/],
conditions: {"CHARCLASS":{"rules":[3,4,5,6,7,8,9,10],"inclusive":false},"QUANTITY":{"rules":[0,1,2],"inclusive":false},"INITIAL":{"rules":[3,4,5,6,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
return parser;
});