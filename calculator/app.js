function parseFormula(formula, data) {
    const operators = {
        '+': (a, b) => a + b,
        '-': (a, b) => a - b,
        '*': (a, b) => a * b,
        '/': (a, b) => a / b
    };

    const precedence = {
        '+': 1,
        '-': 1,
        '*': 2,
        '/': 2
    };

    const calc = (expression) => {
        const values = [];
        const ops = [];

        for (let i = 0; i < expression.length; i++) {
            const token = expression[i]; // 每次处理一个完整的 token
            console.log(`Processing token: ${token}`);
            if (/^\d+(\.\d+)?$/.test(token)) { // 数字（整数或小数）
                values.push(parseFloat(token));
            } else if (token === '(') { // 左括号
                ops.push(token);
            } else if (token === ')') { // 右括号
                while (ops.length && ops[ops.length - 1] !== '(') {
                    applyOperator(ops.pop(), values);
                }
                ops.pop();
            } else if (/[+\-*/]/.test(token)) { // 运算符
                while (
                    ops.length &&
                    precedence[ops[ops.length - 1]] >= precedence[token]
                ) {
                    applyOperator(ops.pop(), values);
                }
                ops.push(token);
            }
        }

        while (ops.length) {
            applyOperator(ops.pop(), values);
        }

        return values.pop();
    };

    const applyOperator = (op, values) => {
        const b = values.pop();
        const a = values.pop();
        values.push(operators[op](a, b));
    };

    // 正则表达式匹配数字、变量和运算符
    const regex = /\d+(\.\d+)?|[a-zA-Z]+|[+\-*/()]/g;

    // 替换变量
    formula = formula.replace(/[a-zA-Z]+/g, match => {
        if (data.hasOwnProperty(match)) {
            return data[match];
        }
        throw new Error(`Undefined variable: ${match}`);
    });

    // 使用正则分解公式为完整的 tokens 数组
    const expression = formula.match(regex);
    console.log(`Parsed expression: ${expression.join(' ')}`);
    
    return calc(expression);
}

module.exports = { parseFormula };
