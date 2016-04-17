

function detlast(positions, parts, p4) {
  var a = positions;
  var i4 = p4*3;
  var n41 = a[i4], n42 = a[i4 + 1], n43 = a[i4 + 2];

  return (
    n41 * parts[0] +
    n42 * parts[1] +
    n43 * parts[2] +
    parts[3]
  );
}

function detparts(positions, p1, p2, p3) {

  var a = positions;
  var i1 = p1*3, i2 = p2*3, i3 = p3*3;

  var n11 = a[i1], n12 = a[i1 + 1], n13 = a[i1 + 2];
  var n21 = a[i2], n22 = a[i2 + 1], n23 = a[i2 + 2];
  var n31 = a[i3], n32 = a[i3 + 1], n33 = a[i3 + 2];

  return [
    (
       + n23 * n32
       - n13 * n32
       - n22 * n33
       + n12 * n33
       + n13 * n22
       - n12 * n23
    ),
    (
       + n11 * n23
       - n11 * n33
       + n21 * n33
       - n13 * n21
       + n13 * n31
       - n23 * n31
    ),
    (
       + n11 * n32
       - n11 * n22
       - n21 * n32
       + n12 * n21
       + n22 * n31
       - n12 * n31
    ),
    (
       - n13 * n22 * n31
       - n11 * n23 * n32
       + n11 * n22 * n33
       + n13 * n21 * n32
       - n12 * n21 * n33
       + n12 * n23 * n31
    )
  ];
}


function determinant(a, p1, p2, p3, p4) {

  var i1 = p1*3, i2 = p2*3, i3 = p3*3;

    var n11 = a[i1], n12 = a[i1 + 1], n13 = a[i1 + 2];
    var n21 = a[i2], n22 = a[i2 + 1], n23 = a[i2 + 2];
    var n31 = a[i3], n32 = a[i3 + 1], n33 = a[i3 + 2];

  var i4 = p4*3;
    var n41 = a[i4], n42 = a[i4 + 1], n43 = a[i4 + 2];

    //TODO: make this more efficient
    //( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

    return (
        n41 * (
            + n23 * n32
             - n13 * n32
             - n22 * n33
             + n12 * n33
             + n13 * n22
             - n12 * n23
        ) +
        n42 * (
            + n11 * n23
             - n11 * n33
             + n21 * n33
             - n13 * n21
             + n13 * n31
             - n23 * n31
        ) +
        n43 * (
            + n11 * n32
             - n11 * n22
             - n21 * n32
             + n12 * n21
             + n22 * n31
             - n12 * n31
        ) +
        (
            - n13 * n22 * n31
             - n11 * n23 * n32
             + n11 * n22 * n33
             + n13 * n21 * n32
             - n12 * n21 * n33
             + n12 * n23 * n31
        )

    );

}