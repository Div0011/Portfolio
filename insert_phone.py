import sys

def insert_phone_block(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    # Find the index of the second location block's closing </a> tag
    location_count = 0
    insert_index = -1
    for i, line in enumerate(lines):
        if '<a class="info__contact w-inline-block"' in line and 'maps.google.com' in line:
            location_count += 1
            if location_count == 2:
                # Find the closing </a> tag for this block
                for j in range(i, len(lines)):
                    if '</a>' in lines[j] and '<a' not in lines[j]:  # simple check
                        insert_index = j + 1  # insert after this line
                        break
                break

    if insert_index == -1:
        print("Could not find the second location block")
        return

    phone_block = '''    <a class="info__contact w-inline-block" data-w-id="0760e948-a62c-1a41-daf6-828f6b6e59ab" href="tel:+919528545302">
      <div class="wrapper-icon__contact">
        <svg class="icon__contact" fill="none" height="200" viewbox="0 0 200 200" width="200" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="100">📱</text>
        </svg>
      </div>
    </a>
'''
    # Insert the phone block lines
    for line in phone_block.splitlines(keepends=True):
        lines.insert(insert_index, line)
        insert_index += 1

    with open(filename, 'w') as f:
        f.writelines(lines)

if __name__ == "__main__":
    insert_phone_block("contact.html")