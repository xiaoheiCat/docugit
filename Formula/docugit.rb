# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_02.13.35_da801e"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_02.13.35_da801e/docugit-darwin-arm64"
      sha256 "cec686902a347e438fe75be3a719f49cc38a9ef252c14dcb9f2933d5dfeb1e5c"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_02.13.35_da801e/docugit-darwin-amd64"
      sha256 "c8c44b542674dee9e217f9db373181f7a1e2da66ff0d54f20724f4c890ce7384"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_02.13.35_da801e/docugit-linux-arm64"
      sha256 "d748611e0f250c95f9f5e9e3c38f139e4f24456f4b4434f285a86bec3f7ef65d"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_02.13.35_da801e/docugit-linux-amd64"
      sha256 "b0cefc9bd5315d0f9cf8a8a6c5d903f8e7f053f6b9e6dd38fdadb16f31e7403c"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
