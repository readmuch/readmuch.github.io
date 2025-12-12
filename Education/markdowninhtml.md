
# 마크다운 파일 문법

## 1. 글쓰기
글자크기는 # 의 갯수로 구분한다. 

## 2. 목록만들기
- **Investor's Risk Appetite**: For instance, 12–25% is a common range.
- **Nature of the Strategy**: Trend-following strategies often exhibit high volatility, so overly low targets might hinder opportunities.
- **Portfolio Alignment**: Consider correlations with other assets and the overall portfolio volatility.

---

## 3. Formula
The basic formula for setting Exposure is as follows:

$$Exposure = \frac{{Target\ Volatility}}{{Realized\ Volatility}}$$

---

## 4. Links Example

[GitHub](https://github.com)

[Stack Overflow](https://stackoverflow.com "Q&A Community")

[Relative Reference](../docs/readme.md)

[Dribbble][Dribbble Link]

[LinkedIn][1]

The document can directly reference [these links]. Below are examples of URLs:

Google: https://www.google.com  
Wikipedia: <https://www.wikipedia.org>

[Dribbble Link]: https://dribbble.com
[1]: https://linkedin.com
[these links]: https://stackoverflow.com "Stack Overflow Home"

---

## 5. Images

[로컬 이미지]

<!-- 크기 조절 -->
<img src="./tree.jpg" alt="로컬 이미지" width="400" height="300">

<img src="./flower.jpg" alt="로컬 이미지" width="400" height="300">

---

## 6. Code Blocks

```html
<a href="https://example.com" target="_blank">Example</a>
```

```css
.container {
  display: flex;
  justify-content: center;
}
```

```javascript
const multiply = (x, y = 2) => {
  console.log(x * y);
  return x * y;
}
```

```bash
$ python script.py
```
 
```python
message = "Hello, Markdown!"
print(message)
```
 
```plaintext
No specific language. 
Just plain text with a <b>tag</b>.
```

---

## 7. Table

| Attribute | Description | Default |
|-----------|-------------|---------|
| `inline`  | Inline block display | `false` |
| `block`   | Full block display   | `true`  |
| `none`    | No display           |  |

| Type     | Explanation            |
|----------|------------------------|
| `flex`   | Flexible display       |
| `grid`   | Grid-based layout      |
| `inline` | Inline element display |

---

## 8. Vertical Bar

| Usage               | Symbol |
|---------------------|--------|
| Vertical bar output | `|`    |
| Inline code         | `\|`   |

---

## 9. Blockquote

> Blockquote - Quoting text or speech directly or indirectly.
> _(Source: Random Dictionary)_

BREAK!

> Create your blockquote!
>> Nested blockquotes are also possible.
>>> Deep Nested Quote 1
>>> Deep Nested Quote 2
>>> Deep Nested Quote 3

---

## 10. Comments

-- Start --

<!-- This is a comment. -->
[//]: # (Another type of comment.)
[//]: # "Inline comment example."

-- End --

---

## 11. Tags

tags: [finance, strategy, markdown]

---

## 12. Strikethrough, Bold, and Italics

Use * or _ for Italics.

Use ** or __ for Bold.

For strikethrough, use ~~.  
For underlines, use <U></U> (uppercase U).

*Italics*

_Italics_

**Bold**

__Bold__

~~Strikethrough~~

<U>Underline</U>
