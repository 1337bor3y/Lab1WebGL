export default function LoadTexture(gl, url)
{
    // Create a new texture object in WebGL
    var texture = gl.createTexture();
    
    // Bind the texture to the TEXTURE_2D target
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set texture wrapping for both horizontal (S) and vertical (T) axes
    // CLAMP_TO_EDGE ensures that coordinates outside [0,1] range are clamped to the edge of the texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Set texture filtering for minification (when texture is reduced in size) and magnification (when texture is enlarged)
    // LINEAR filtering smooths the texture when it is scaled
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Initialize the texture with a 1x1 blue image (placeholder) while the actual image is loading
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
    
    // Create a new Image object to load the actual texture image from the given URL
    var image = new Image();
    
    // Set the crossOrigin attribute to 'anonymous' to allow loading images from different origins (CORS)
    image.crossOrigin = 'anonymous';
    
    // Set the image source to the provided URL
    image.src = url;
    
    // When the image has loaded, update the texture with the actual image data
    image.addEventListener('load', () => {
        // Bind the texture again (now with the actual image data)
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Copy the loaded image into the texture memory
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Dispatch a 'draw' event to trigger a redraw of the scene with the new texture
        document.dispatchEvent(new Event('draw'));
    });

    // Return the texture object so it can be used in other parts of the application
    return texture;
}
